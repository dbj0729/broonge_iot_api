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

          if (checksum === manual_codes_value_verification) {
            //bike_id_from_iot 는 IEMI 값
            const [findImei] = await (
              await connection()
            ).query('SELECT * FROM iot_status WHERE bike_id = ?', [bike_id_from_iot]) // imei => bike_id

            if (findImei.length === 0) {
              const status =
                f_4_device_status === '03' ? 'malfunctioning' : f_4_device_status === '00' ? 'in_use' : 'stand_by'
              const is_locked =
                f_4_device_status === '03' ? 'malfunctioning' : f_4_device_status === '00' ? 'NO' : 'YES'

              if (gps_reformatted.length === 1) {
                f_1_lng = 127.0895133
                f_1_lat = 37.2115683
              }

              await (
                await connection()
              ).query(
                `INSERT INTO iot_status SET bike_id = ?, usim = ?, battery = ?, lat = HEX(AES_ENCRYPT(?, SHA2('${process.env.KEY}', 256))), lng = HEX(AES_ENCRYPT(?, SHA2('${process.env.KEY}', 256))), signal_strength = ?, status = ?, is_locked = ?, point =  ST_GeomFromText('POINT(? ?)')`,
                [
                  // imei => usim
                  bike_id_from_iot,
                  bike_id_from_iot,
                  f_3_battery,
                  f_1_lat,
                  f_1_lng,
                  f_2_signal_strength,
                  status,
                  is_locked,
                  Number(f_1_lng),
                  Number(f_1_lat),
                ],
              )

              await (
                await connection()
              ).query(
                `INSERT INTO bikes SET id = ?, is_active = 'YES', reg_date = ?, owner_user_admin_id = ?, iot_version = ?, is_updated_to_the_latest = 'YES'`,
                [bike_id_from_iot, moment().format('YYYY-MM-DD HH:mm:ss'), 14, version],
              )
            }

            await (
              await connection()
            ).query(`UPDATE iot_status SET update_date = ? WHERE bike_id = ?`, [
              moment().format('YYYY-MM-DD HH:mm:ss'),
              bike_id_from_iot,
            ])

            await repeatUpdate(data_elements)

            //TODO: usim으로 바꿔달라는 code 현재 사용하지 않음
            // let sig_for_app = process.env.IOT_SIG
            // let group_for_app = process.env.IOT_GROUP
            // let op_code_for_app = '3' // 3번이 보내는 경우이다.

            // let version_for_app = 'APP'
            // let message_length_for_app = '02' //IOT_ERROR_MESSAGE_LENGTH???
            // let send_default_data_preparation =
            //   sig_for_app +
            //   group_for_app +
            //   op_code_for_app +
            //   bike_id_from_iot +
            //   version_for_app +
            //   message_length_for_app

            // function sending_codes(send_code) {
            //   let combined_send_codes = send_code.split('')
            //   let send_codes_value = combined_send_codes
            //     .map(item => item.charCodeAt())
            //     .reduce((acc, curr) => acc + curr)
            //   let send_codes_value_verification = send_codes_value.toString(16)
            //   let send_codes_manually_added_0x = '00' + send_codes_value_verification
            //   let final_send_codes = send_default_data_preparation + send_code + send_codes_manually_added_0x
            //   return final_send_codes
            // }
            // await new Promise(resolve => setTimeout(resolve, 200))
            // socket.write(sending_codes('11')) //toUsim
          }
        } else if (sig == process.env.IOT_SIG && group == process.env.IOT_GROUP && op_code === 'B') {
          // firmware upgrade ack opcode = 'B'
          //BR01B868675060022852T99030000090
          //BR01B / 1223129999 / ver / 03 / 000 / csum
          const bike = data_elements.slice(5, 20)
          const message = data_elements.slice(25, 28)
          const checksum = data_elements.slice(-4)
          const verification =
            '00' +
            message
              .split('')
              .reduce((acc, curr) => acc + curr.charCodeAt(), 0)
              .toString(16)
          //message 99 = fail / 88 = success
          if (checksum !== verification) return console.log('firmware checksum error')
          if (message == '999') return console.log('this bike is not ready to be updated')
          if (message == '888') return console.log('update completed')

          const currentNum = Number(message)

          //파일 읽어 오기
          const [result] = await (await connection()).query(`SELECT * FROM update_mgmt ORDER BY id DESC LIMIT 1`)
          const readFile = result[0].file_body

          const sendData = readFile.slice(currentNum * 512, (currentNum + 1) * 512)
          //header
          var sig_for_app = process.env.IOT_SIG
          var group_for_app = process.env.IOT_GROUP
          var op_code_for_app = '9' // firmware update
          var version_for_app = 'APP'

          let msgLength = String(sendData.length)
          while (msgLength.length < 4) {
            msgLength = '0' + msgLength
          }

          console.log('보내는 DATA 길이 : ', sendData.length)

          var send_default_data_preparation =
            sig_for_app + group_for_app + op_code_for_app + bike + version_for_app + msgLength
          const headerBuf = Buffer.from(send_default_data_preparation)

          //checksum
          let checkSum = 0
          for (let i = 0; i < sendData.length; i++) {
            checkSum += sendData[i]
          }

          checkSum = checkSum.toString(16)
          if (checkSum.length >= 4) checkSum = checkSum.slice(-4)
          else {
            while (checkSum.length < 4) {
              checkSum = '0' + checkSum
            }
          }

          const checkSumBuf = Buffer.from(checkSum)
          const lastArr = [headerBuf, sendData, checkSumBuf]
          const lastConcatBuf = Buffer.concat(lastArr)

          await new Promise(resolve => setTimeout(resolve, 200))
          sockets[bike].write(lastConcatBuf)
          return
        } else if (sig == process.env.IOT_SIG && group == 'FF' && op_code == 'F') {
          // web 관리자가 firmware update 요청시
          //BRFFF.user_admin_id
          const admin_id = Number(data_elements.split('.')[1])

          //업데이트할 자전거 리스트
          const [upgradeLists] = await (
            await connection()
          ).query(`SELECT upgrade_lists FROM firmware_lists WHERE user_admin_id = ?`, [admin_id])
          const bikeLists = upgradeLists[0].upgrade_lists.split(',')
          console.log({ bikeLists })

          //파일 읽어 오기
          const [result] = await (await connection()).query(`SELECT * FROM update_mgmt ORDER BY id DESC LIMIT 1`)
          const readFile = result[0].file_body

          const firstFile = readFile.slice(0, 512)

          for (let bike of bikeLists) {
            //to send iot op code = 9
            var sig_for_app = process.env.IOT_SIG
            var group_for_app = process.env.IOT_GROUP
            var op_code_for_app = '9' // firmware update
            var version_for_app = 'APP'
            var message_length_for_app = firstFile.length

            //무조건 length는 0512라 따로
            var send_default_data_preparation =
              sig_for_app + group_for_app + op_code_for_app + bike + version_for_app + '0' + message_length_for_app
            const headerBuf = Buffer.from(send_default_data_preparation)

            let lastCheckSum = 0

            //checksum
            for (let i = 0; i < firstFile.length; i++) {
              lastCheckSum += firstFile[i]
            }

            lastCheckSum = lastCheckSum.toString(16)
            if (lastCheckSum.length >= 4) lastCheckSum = lastCheckSum.slice(-4)
            else {
              while (lastCheckSum.length < 4) {
                lastCheckSum = '0' + lastCheckSum
              }
            }

            const lastCheckSumBuf = Buffer.from(lastCheckSum)
            const lastArr = [headerBuf, firstFile, lastCheckSumBuf]
            const lastConcatBuf = Buffer.concat(lastArr)

            sockets[bike].write(lastConcatBuf)
          }
          socket.write('ok')
        } else if (sig == process.env.IOT_SIG && group == process.env.IOT_GROUP && (op_code == '2' || op_code == 'A')) {
          //response
          //BR0128686750600014761223129999/090/02/00/0060 응답코드

          // ver/msgl/msg/checksum
          const imei = data_elements.slice(5, 20)
          const version = data_elements.slice(20, 23)
          const message = data_elements.slice(25, 27) === '00' ? '정상' : '오류'

          console.log({ 바이크아이디: imei, 버전: version, 결과: message })
          // const usim = data_elements.slice(20, 30)
          // const message = data_elements.slice(35, 37)
          // const checksum = data_elements.slice(37)
          // const verification =
          //   '00' +
          //   message
          //     .split('')
          //     .reduce((acc, curr) => acc + curr.charCodeAt(), 0)
          //     .toString(16)

          // //opcode A ack 00 정상 01 error

          // if (checksum !== verification || message !== '00') {
          //   return console.log('req error')
          // }

          // sockets[usim] = socket

          // const [findUsim] = await (
          //   await connection()
          // ).query('SELECT bike_id, usim FROM iot_status WHERE usim = ? LIMIT 1', [usim])

          // if (findUsim.length !== 0) {
          //   if (findUsim[0].bike_id !== imei) {
          //     await (
          //       await connection()
          //     ).query('UPDATE iot_status SET usim = ? WHERE bike_id = ?', [findUsim[0].bike_id, findUsim[0].bike_id])

          //     await (await connection()).query('UPDATE iot_status SET usim = ? WHERE bike_id = ?', [usim, imei])
          //   }
          // } else {
          //   // 등록된 usim이 없으면 usim을 등록한다
          //   await (await connection()).query(`UPDATE iot_status SET usim = ? WHERE bike_id = ?`, [usim, imei])
          // }

          // console.log('responseCode', { data_elements, imei, usim, message, checksum, verification })
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

          // IoT 에서 보낸 값이 누락없이 잘 왔는지 모든 글자의 ASCII 코드 값을 다 더한 후 16진수로 변환해서
          // IoT 보냈던 Checksum 값과 동일한지를 확인하고 동일해야지만 서버에 저장된다.
          // 만약, Checksum 이 다른 경우에는 데이터를 버려버린다. IoT 에 Return 할 필요는 없다.
          // 단, 만약, 20회 이상 Checksum 오류가 나는 경우에는 관리자에게 안내를 해 줘야 한다.
          manual_codes_value_verification = manual_codes_value.toString(16) // 분배된 값을 16진수로 변경

          manually_added_0x = '0' + manual_codes_value_verification // 마지막 checksum 에 0이 빠져서 0을 넣음

          sockets[bike_id_from_iot] = socket
          console.log(
            'socketAddress',
            sockets[bike_id_from_iot].remoteAddress + ':' + sockets[bike_id_from_iot].remotePort,
          )

          if (checksum == manually_added_0x) {
            // IoT 로 부터 받은 값이 모두 문제 없이 다 통과했을 때 실행
            // bike_id_from_iot = usim 10자리
            const [convertToBikeId] = await (
              await connection()
            ).query(`SELECT bike_id FROM iot_status WHERE usim = ?`, [bike_id_from_iot])
            const bike_id_imei = convertToBikeId[0].bike_id

            try {
              console.log('IoT 로 부터 받은 값이 모두 문제 없이 다 통과한 시간 : ' + getCurrentTime())

              // version check
              // const [bike_version] = await (
              //   await connection()
              // ).query(`SELECT iot_version FROM bikes WHERE id = ?`, [bike_id_imei])

              // if (!bike_version[0].iot_version || bike_version[0].iot_version !== version) {
              //   await (
              //     await connection()
              //   ).query(`UPDATE bikes SET iot_version = ?, is_updated_to_the_latest = 'YES' WHERE id = ?`, [
              //     version,
              //     bike_id_imei,
              //   ])
              // }

              // to IMEI test Change ip
              if (bike_id_from_iot === '1223129999' && process.env.IOT === 'deploy') {
                let sig_for_app = process.env.IOT_SIG
                let group_for_app = process.env.IOT_GROUP
                let op_code_for_app = '3' // 3번이 보내는 경우이다.

                let version_for_app = 'APP'
                let message_length_for_app = '13' //IOT_ERROR_MESSAGE_LENGTH???
                let send_default_data_preparation =
                  sig_for_app +
                  group_for_app +
                  op_code_for_app +
                  bike_id_from_iot +
                  version_for_app +
                  message_length_for_app

                function sending_codes(send_code) {
                  let combined_send_codes = send_code.split('')
                  let send_codes_value = combined_send_codes
                    .map(item => item.charCodeAt())
                    .reduce((acc, curr) => acc + curr)
                  let send_codes_value_verification = send_codes_value.toString(16)
                  let send_codes_manually_added_0x = '0' + send_codes_value_verification
                  let final_send_codes = send_default_data_preparation + send_code + send_codes_manually_added_0x
                  return final_send_codes
                }
                console.log('ip change checksum', sending_codes('IP3.38.210.99'))
                await new Promise(resolve => setTimeout(resolve, 200))
                sockets[bike_id_from_iot].write(sending_codes('IP3.38.210.99'))
                return
              }

              //TODO: firmware test server
              if (bike_id_from_iot === '1223128888' && process.env.IOT === 'dev') {
                let lastBuffer = Buffer.alloc(512)
                for (let i = 0; i < 512; i++) {
                  lastBuffer[i] = FILE[i]
                }

                // if (testLength === 73) testLength = 973
                // else if (testLength === 973) testLength = 1024
                // else if (testLength === 1024) testLength = 73

                //header
                var sig_for_app = process.env.IOT_SIG
                var group_for_app = process.env.IOT_GROUP
                var op_code_for_app = '9' // firmware update
                var version_for_app = 'APP'

                let msgLength = String(lastBuffer.length)
                console.log('while 문 전 msgLength', msgLength)
                while (msgLength.length < 4) {
                  msgLength = '0' + msgLength
                }
                console.log('while 문 후 msgLength', msgLength)

                var message_length_for_app = lastBuffer.length >= 1000 ? lastBuffer.length : msgLength
                var send_default_data_preparation =
                  sig_for_app +
                  group_for_app +
                  op_code_for_app +
                  bike_id_from_iot +
                  version_for_app +
                  message_length_for_app
                const headerBuf = Buffer.from(send_default_data_preparation)

                let lastCheckSum = 0

                //checksum
                for (let i = 0; i < lastBuffer.length; i++) {
                  lastCheckSum += lastBuffer[i]
                }

                lastCheckSum = lastCheckSum.toString(16)
                if (lastCheckSum.length >= 4) lastCheckSum = lastCheckSum.slice(-4)
                else {
                  while (lastCheckSum.length < 4) {
                    lastCheckSum = '0' + lastCheckSum
                  }
                }

                const lastCheckSumBuf = Buffer.from(lastCheckSum)
                const lastArr = [headerBuf, lastBuffer, lastCheckSumBuf]
                const lastConcatBuf = Buffer.concat(lastArr)

                await new Promise(resolve => setTimeout(resolve, 200))
                sockets[bike_id_from_iot].write(lastConcatBuf)
                return
              }

              //자전거가 보낸 통신일 경우
              //DB에 해당 자전거 ID가 등록되어 있는지 확인
              //FIXME: 기존에 SELECT * FROM iot_status 였는데, 이건 생각해 보니 위도경도 모두를 불러오는 격인데, delay 가 생겨서 IoT 가 밀린 것은 아닌가? @DBJ on 230213
              const findBikeInIotStatusQuery = `SELECT CONVERT(AES_DECRYPT(UNHEX(lng), SHA2('${process.env.KEY}', 256)) USING UTF8) AS lng, CONVERT(AES_DECRYPT(UNHEX(lat), SHA2('${process.env.KEY}', 256)) USING UTF8) AS lat, status FROM iot_status WHERE bike_id = ? limit 1`
              const [findBikeInIotStatus] = await (await connection()).query(findBikeInIotStatusQuery, [bike_id_imei])

              if (findBikeInIotStatus.length === 0) {
                console.log('등록되지 않은 자전거입니다.', bike_id_from_iot)
                return
              }

              if (gps_reformatted.length === 1) {
                f_1_lng = findBikeInIotStatus[0].lng
                f_1_lat = findBikeInIotStatus[0].lat
              }

              if (!f_1_lng && f_1_lat === '??????????') {
                f_1_lng = 127.0895133
                f_1_lat = 37.2115683
              }

              const isPossibleUpdateStatus =
                findBikeInIotStatus[0].status === 'stand_by' ||
                findBikeInIotStatus[0].status === 'in_use' ||
                findBikeInIotStatus[0].status === 'malfunctioning'

              let partQuery = ''
              if (isPossibleUpdateStatus) {
                partQuery =
                  f_4_device_status === '03'
                    ? `status = 'malfunctioning'`
                    : f_4_device_status === '00' // 00 이 해제상태
                    ? `status = 'in_use', is_locked = 'NO'`
                    : f_4_device_status === '01' // 01 이 잠긴상태
                    ? `status = 'stand_by', is_locked = 'YES'`
                    : `status = 'malfunctioning'`
              } else {
                partQuery =
                  f_4_device_status === '03'
                    ? `status = 'malfunctioning'`
                    : f_4_device_status === '00' // 00 이 해제상태
                    ? `is_locked = 'NO'`
                    : f_4_device_status === '01' // 01 이 잠긴상태
                    ? `is_locked = 'YES'`
                    : `status = 'malfunctioning'`
              }

              const updateBikeStatusQuery = `UPDATE iot_status SET battery = ?, lat = HEX(AES_ENCRYPT(?, SHA2('${process.env.KEY}', 256))), lng = HEX(AES_ENCRYPT(?, SHA2('${process.env.KEY}', 256))), signal_strength = ?, point = ST_GeomFromText('POINT(? ?)'), ${partQuery} WHERE bike_id = ?`
              const [result] = await (
                await connection()
              ).query(updateBikeStatusQuery, [
                f_3_battery,
                f_1_lat,
                f_1_lng,
                f_2_signal_strength,
                Number(f_1_lng),
                Number(f_1_lat),
                bike_id_imei,
              ])

              if (f_4_device_status === '00') {
                // 여기를 파일로 저장했다가 보내는 방식으로 진행하는 것이 좋을 것 같다 @DBJ 230213
                const selectBikeRiding = `SELECT distance, CONVERT(AES_DECRYPT(UNHEX(coordinates), SHA2('${process.env.KEY}', 256)) USING UTF8) AS coordinates, id FROM riding_data WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
                const [selectResult] = await (await connection()).query(selectBikeRiding, [bike_id_imei])

                if (selectResult.length === 0) {
                  const [ridingDataManager] = await (
                    await connection()
                  ).query(
                    `SELECT * FROM riding_data_manager WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`,
                    [bike_id_imei],
                  )

                  if (ridingDataManager.length === 0)
                    return console.log('라이딩 데이터가 없는 자전거가 움직이는 중입니다.', bike_id_imei)

                  const { coordinates, dist } = updateCoords(ridingDataManager, f_1_lat, f_1_lng)

                  if (dist === 0) return

                  await (
                    await connection()
                  ).query('UPDATE riding_data_manager SET coordinates = ?, distance = ? WHERE id = ?', [
                    JSON.stringify(coordinates),
                    dist.toFixed(1),
                    ridingDataManager[0].id,
                  ])

                  return
                }

                let coordinates = []
                console.log()
                let dist = selectResult[0].distance ? Number(selectResult[0].distance) : 0

                if (selectResult[0].coordinates) {
                  coordinates = JSON.parse(selectResult[0].coordinates)
                  const distPoints = distance(
                    Number(f_1_lat),
                    Number(f_1_lng),
                    Number(coordinates[coordinates.length - 1].lat),
                    Number(coordinates[coordinates.length - 1].lng),
                    'K',
                  )

                  console.log({ 이동거리: distPoints })
                  if (distPoints === 0) return
                  else dist += distPoints
                }

                coordinates = [...coordinates, { lat: Number(f_1_lat), lng: Number(f_1_lng) }]

                const updateBikeRiding = `UPDATE riding_data SET coordinates = HEX(AES_ENCRYPT(?, SHA2('${process.env.KEY}', 256))), distance = ? WHERE id = ?`
                await (
                  await connection()
                ).query(updateBikeRiding, [JSON.stringify(coordinates), dist.toFixed(1), selectResult[0].id])
              } else if (f_4_device_status === '01') {
                const [riding_data_manager] = await (
                  await connection()
                ).query(
                  'SELECT id FROM riding_data_manager WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1',
                  [bike_id_imei],
                )

                if (riding_data_manager.length > 0) {
                  await (
                    await connection()
                  ).query('UPDATE riding_data_manager SET end_datetime = ? WHERE id = ?', [
                    moment().add(9, 'h').format('YYYY-MM-DD HH:mm:ss'),
                    riding_data_manager[0].id,
                  ])
                }
              }

              console.log('업데이트 실패 횟수 : ' + failUpdate)
            } catch (error) {
              failUpdate += 1
              console.log('업데이트 실패!!' + error)
              console.log('업데이트 실패 횟수 : ' + failUpdate)
            }
          } else {
            delete sockets[bike_id_from_iot]
            // socket.destroy()
            console.log('checksum: ' + checksum)
            console.log('manually_added_0x: ' + manually_added_0x)
            console.log(`bikeSocket: Wrong type of data transaction.`) // 상기 횟수에 따라 오류가 발생할 경우, 관리자 Alert 를 띄워야 한다.
          }
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

          var send_default_data_preparation =
            sig_for_app + group_for_app + op_code_for_app + bike_id_for_app + version_for_app + message_length_for_app

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
