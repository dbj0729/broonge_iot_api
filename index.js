require('dotenv').config()
const net = require('net')
const fs = require('fs')

const moment = require('moment')
var Mutex = require('async-mutex').Mutex
var Semaphore = require('async-mutex').Semaphore

const mutex = new Mutex()
const semaphore = new Semaphore(1)

const { distance } = require('./functions/distance')
const { getCurrentTime } = require('./functions/getCurrentTime')
const { repeatUpdate } = require('./functions/repeatUpdate')
const { connection } = require('./config/database')
const { updateCoords } = require('./functions/updateCoords')
const IOT_PORT = process.env.IOT_PORT || '8000'
const { convertBattery } = require('./functions/convertBattery')

let testLength = 1024

//TODO: firmware upgrade
let updateFile
const FILE = fs.readFileSync('CH32V203C8T6.bin')
let max = Math.ceil(FILE.length / 1024)

let size_1 = 2 // Sig.
let size_2 = 2 // Group
let size_3 = 1 // OP Code

let sig_1 = size_1
let sig_2 = sig_1 + size_2
let sig_3 = sig_2 + size_3

let sockets = {}
let beforeSendBikeId = ''
let duplicateGPS = {}
let failUpdate = 0

// 서버 생성
var server = net.createServer(async function (socket) {
  const release1 = await mutex.acquire()
  try {
    console.log('\n')
    console.log(socket.address().address + ' Started Broonge IoT Server on ' + getCurrentTime())
    socket.setNoDelay(true)
    socket.setKeepAlive(true)

    socket.id = socket.remoteAddress + ':' + socket.remotePort

    const [value, release] = await semaphore.acquire()
    try {
      socket.on('timeout', () => {
        console.log('시간초과로 연결이 끊겼습니다.')
      })

      socket.on('error', function (err) {
        console.log('socket error : ' + err)
      })

      socket.on('end', () => {
        console.log('socket 연결을 상대방이 끊었습니다.')
        console.log('현재 연결된 자전거 수', Object.keys(sockets).pop().length - 1) // 현재 연결된 자전거 수
      })

      // client와 접속이 끊기는 메시지 출력
      socket.on('close', function () {
        console.log('socket closed')
      })

      socket.on('data', async function (data) {
        let data_elements = data.toString('utf-8').trim()
        console.log('\n')
        console.log('-----------------------------------------')
        console.log('받은 값 : ' + data_elements)
        console.log('데이터 받은 시간', getCurrentTime())
        console.log('누적 연결된 자전거 수 : ', Object.keys(sockets).length)

        // IoT 로부터 받는 정보이다.

        const sig = data_elements.slice(0, sig_1)
        const group = data_elements.slice(sig_1, sig_2)
        const op_code = data_elements.slice(sig_2, sig_3)

        let size_4 = 15
        let size_5 = 3 // Version
        let size_6 = 2 // MSG Length
        let size_7 = 23 // GPS
        let size_8 = 1 // Signal Strength
        // Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
        let sig_4 = sig_3 + size_4
        let sig_5 = sig_4 + size_5
        const version = data_elements.slice(sig_4, sig_5)
        const vName = version.slice(0, 1)
        const vNumber = Number(version.slice(1))

        let size_9 = vName === 'V' && vNumber > 1 ? 4 : 2 // Battery V02부터 4자리로 들어온다
        let size_10 = 2 // Device Status
        let size_11 = 2 // Error Info
        let size_12 = 4 // Checksum
        let error_report_size = 2 //Error Report: “01”:Sig error “02”:Group error “03”:OP code error “04”:ID error “05”:chksum error

        let sig_6 = sig_5 + size_6 //20
        let sig_7 = sig_6 + size_7 //43
        let sig_8 = sig_7 + size_8
        let sig_9 = sig_8 + size_9
        let sig_10 = sig_9 + size_10
        let sig_11 = sig_10 + size_11
        let sig_12 = sig_11 + size_12
        let sig_error_report = sig_6 + error_report_size

        const bike_id_from_iot = data_elements.slice(sig_3, sig_4)
        const message_length = data_elements.slice(sig_5, sig_6)

        const f_1_gps = data_elements.slice(sig_6, sig_7)

        const f_2_signal_strength = data_elements.slice(sig_7, sig_8)
        let f_3_battery = data_elements.slice(sig_8, sig_9)
        const f_4_device_status = data_elements.slice(sig_9, sig_10)
        const f_5_err_info = data_elements.slice(sig_10, sig_11)
        const gps_reformatted = f_1_gps.split('N') // 이 부분이 IoT 좌표에서 넘어올 때 구분되어 지는 값이다.
        let f_1_lat = gps_reformatted[0].slice(0, 10) // 딱 10자리만 가져온다.
        let f_1_lng = gps_reformatted[1] ? gps_reformatted[1].slice(0, 11) : undefined

        const checksum = data_elements.slice(sig_11, sig_12)

        const isMashDataV02 = op_code == 4 && data_elements.length > 61 && size_9 === 4
        const isMashDataV01 = op_code == 4 && data_elements.length > 59 && size_9 === 2
        //version V02부터 배터리 정보를 볼트값 그대로 준다. length = 61
        if (isMashDataV01 || isMashDataV02) {
          let tempConvert = data_elements.split('BR')
          let dataArr = []
          for (let cd of tempConvert) {
            if (!cd) continue
            dataArr.push('BR' + cd)
          }

          for (let d of dataArr) {
            await repeatUpdate(d)
          }
          return
        }

        console.log('바이크 아이디', bike_id_from_iot)
        // 변경되는 값; 이 부분을 저장해야 한다.
        let manual_codes = f_1_gps + f_2_signal_strength + f_3_battery + f_4_device_status + f_5_err_info

        f_3_battery =
          vName === 'V' && vNumber > 1
            ? convertBattery(data_elements.slice(sig_8, sig_9))
            : data_elements.slice(sig_8, sig_9)

        if (sig == process.env.IOT_SIG && group == process.env.IOT_GROUP && op_code == 4) {
          //IMEI로 통신
          sockets[bike_id_from_iot] = socket
          console.log(
            'socketAddress',
            sockets[bike_id_from_iot].remoteAddress + ':' + sockets[bike_id_from_iot].remotePort,
          )

          const combined_manual_codes = manual_codes.split('')
          const manual_codes_value = combined_manual_codes
            .map(item => item.charCodeAt())
            .reduce((acc, curr) => acc + curr)
            .toString(16)
          let manual_codes_value_verification = manual_codes_value.slice(-4)
          while (manual_codes_value_verification.length < 4)
            manual_codes_value_verification = '0' + manual_codes_value_verification
        } else if (sig == process.env.IOT_SIG && group == process.env.IOT_GROUP && (op_code == '2' || op_code == 'A')) {
          //response
          //BR0128686750600014761223129999/090/02/00/0060 응답코드

          // ver/msgl/msg/checksum
          const imei = data_elements.slice(5, 20)
          const version = data_elements.slice(20, 23)
          const message = data_elements.slice(25, 27) === '00' ? '정상' : '오류'

          console.log({ 바이크아이디: imei, 버전: version, 결과: message })
        } else if (
          sig == process.env.IOT_SIG &&
          group == process.env.IOT_GROUP &&
          op_code == process.env.IOT_OP_CODE &&
          manual_codes.length !== 0
        ) {
          const combined_manual_codes = manual_codes.split('') // data 에서 온 raw 값을 글자 단위로 쪼갠 결과
          const manual_codes_value = combined_manual_codes
            .map(item => item.charCodeAt())
            .reduce((acc, curr) => acc + curr) // 쪼갠 결과를 하나씩 분배

          manual_codes_value_verification = manual_codes_value.toString(16) // 분배된 값을 16진수로 변경

          manually_added_0x = '0' + manual_codes_value_verification // 마지막 checksum 에 0이 빠져서 0을 넣음

          sockets[bike_id_from_iot] = socket
          console.log(
            'socketAddress',
            sockets[bike_id_from_iot].remoteAddress + ':' + sockets[bike_id_from_iot].remotePort,
          )
        } else {
          // App 에서 IoT 로 보내기 위해 받는 Protocol
          // a001, 자전거 번호, unlock...
          let app_to_iot_data = data_elements.split(',')

          // App 에서 IoT 로 정보를 보내기 위한 기본 변수들이다.
          var sig_for_app = process.env.IOT_SIG
          var group_for_app = process.env.IOT_GROUP
          var op_code_for_app = '3' // 3번이 보내는 경우이다.
          let bike_id_for_app = app_to_iot_data[1] //imei 15자리
          var version_for_app = 'APP'
          var message_length_for_app = '02'

          var send_default_data_preparation =
            sig_for_app + group_for_app + op_code_for_app + bike_id_for_app + version_for_app + message_length_for_app

          function sending_codes(send_code, header) {
            let combined_send_codes = send_code.split('')
            let send_codes_value = combined_send_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr)
            let send_codes_value_verification = send_codes_value.toString(16)
            while (send_codes_value_verification.length < 4) {
              send_codes_value_verification = '0' + send_codes_value_verification
            }
            let final_send_codes = header + send_code + send_codes_value_verification
            return final_send_codes
          }

          if (app_to_iot_data[0] === 'b001') {
            sockets[bike_id_for_app].write(app_to_iot_data[2])
            socket.write('ok')
            socket.destroy()
            return
          }

          if (app_to_iot_data[0] === 'c001') {
            // ip change
            let message_length = app_to_iot_data[2].length
            let send_default_data_preparation =
              sig_for_app + group_for_app + op_code_for_app + bike_id_for_app + version_for_app + message_length

            await new Promise(resolve => setTimeout(resolve, 200))
            sockets[bike_id_for_app].write(sending_codes(app_to_iot_data[2], send_default_data_preparation))
            console.log('iot로 보낸 값 : ', sending_codes(app_to_iot_data[2], send_default_data_preparation))
            socket.write('ok')
            socket.destroy()
            return
          }

          if (app_to_iot_data[0] === 'r001') {
            sockets[bike_id_for_app].write(sending_codes('99', send_default_data_preparation))
            console.log('iot로 보낸 값 : ', sending_codes('99', send_default_data_preparation))
            socket.write('ok')
            socket.destroy()
            return
          }

          async function updateBikeStatus(order) {
            if (order === 'AA') {
              sockets[bike_id_for_app].write(sending_codes(order, send_default_data_preparation))
              socket.write('ok')
              return
            }
            const code =
              order === 'unlock'
                ? '01'
                : order === 'page'
                ? '02'
                : order === 'reset'
                ? '99'
                : order === 'enable'
                ? '04'
                : '03'

            if (!code) return socket.write('not order')

            if (beforeSendBikeId === bike_id_for_app) await new Promise(resolve => setTimeout(resolve, 1000))

            sockets[bike_id_for_app].write(sending_codes(code, send_default_data_preparation))
            console.log('apptoIOT : ' + sending_codes(code, send_default_data_preparation))
            beforeSendBikeId = bike_id_for_app

            socket.write(sending_codes(code, send_default_data_preparation))
            socket.destroy()
          }

          if (app_to_iot_data[0] == process.env.APP_SIG) {
            if (!app_to_iot_data[2]) {
              console.log('appSocket : data parsing error')
              socket.write('something wrong')
            } else {
              if (!sockets[bike_id_for_app]) {
                socket.write('no connected bike!')
                console.log('통신이 연결된 자전거가 아닙니다')
                return
              }
              await updateBikeStatus(app_to_iot_data[2])
            }
          } else {
            console.log('???????', data_elements)
            // socket.write('sorry, no bike')
          }
        }
      })
    } finally {
      console.log('------ finally 부분 수행 ------')
      console.log('\n')
      await new Promise(resolve => setTimeout(resolve, 300))
      release()
    }
  } finally {
    await new Promise(resolve => setTimeout(resolve, 300))
    release1()
  }
})

server.getConnections((err, count) => {
  if (err) console.log(err)
  console.log(count)
})

server.on('error', function (err) {
  console.log('server err' + err)
})

server.listen(IOT_PORT, function () {
  console.log(`Listening for requests on port ${IOT_PORT}`)
})
