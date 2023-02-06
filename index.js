const net = require('net')
const fs = require('fs')
// const readlinePromises = require("node:readline");
// const rl = readlinePromises.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });
var Mutex = require('async-mutex').Mutex
var Semaphore = require('async-mutex').Semaphore

const mutex = new Mutex()
const semaphore = new Semaphore(1)

function getCurrentTime() {
  var adjust_time_manual = 9 * 60 * 60 * 1000
  const datetime_in_number = Number(new Date()) + adjust_time_manual
  const datetime = new Date(datetime_in_number).toLocaleString('ko-KR')
  const result = String(datetime)
  return result
}
// const distance = require('./functions/distance.js')
function distance(lat1, lon1, lat2, lon2, unit) {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0
  } else {
    var radlat1 = (Math.PI * lat1) / 180
    var radlat2 = (Math.PI * lat2) / 180
    var theta = lon1 - lon2
    var radtheta = (Math.PI * theta) / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515
    if (unit === 'K') {
      dist = dist * 1.609344
    }
    if (unit === 'N') {
      dist = dist * 0.8684
    }
    return dist
  }
}

function distance_sum(distance_value, previous_value) {
  const result = distance_value + previous_value
  return result
}

// var Buffer = require('buffer/').Buffer

require('dotenv').config()
const { connection } = require('./config/database')

const IOT_PORT = process.env.IOT_PORT || '8000'
// const distance_value = 0 @DBJ 없어도 되나?

// IoT 에서 받는 Header byte size
let size_1 = 2 // Sig.
let size_2 = 2 // Group
let size_3 = 1 // OP Code

let sig_1 = size_1
let sig_2 = sig_1 + size_2
let sig_3 = sig_2 + size_3

// let size_4 = 10 // ID
// let size_5 = 3 // Version
// let size_6 = 2 // MSG Length
// let size_7 = 23 // GPS
// let size_8 = 1 // Signal Strength
// let size_9 = 2 // Battery
// let size_10 = 2 // Device Status
// let size_11 = 2 // Error Info
// let size_12 = 4 // Checksum
// let error_report_size = 2 //Error Report: “01”:Sig error “02”:Group error “03”:OP code error “04”:ID error “05”:chksum error

// // Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
// let sig_4 = sig_3 + size_4
// let sig_5 = sig_4 + size_5
// let sig_6 = sig_5 + size_6 //20
// let sig_7 = sig_6 + size_7 //43
// let sig_8 = sig_7 + size_8
// let sig_9 = sig_8 + size_9
// let sig_10 = sig_9 + size_10
// let sig_11 = sig_10 + size_11
// let sig_12 = sig_11 + size_12
// let sig_error_report = sig_6 + error_report_size

let sockets = {}
let beforeSendBikeId = ''
let duplicateGPS = {}
let failUpdate = 0

// fs.readFile('CH32V203C8T6.bin', (err, data) => {
//   if (err) console.log(err)
//   const max = Math.floor(data.length / 1025)

//   var sig_for_app = process.env.IOT_SIG
//   var group_for_app = process.env.IOT_GROUP
//   var op_code_for_app = '3' // 3번이 보내는 경우이다.

//   var version_for_app = 'APP'
//   var message_length_for_app = '1024' //IOT_ERROR_MESSAGE_LENGTH???
//   var send_default_data_preparation =
//     sig_for_app + group_for_app + op_code_for_app + 'test' + version_for_app + message_length_for_app

//   const headerBuf = new Buffer(send_default_data_preparation)
//   for (let i = 0; i < max; i++) {
//     const sendBuf = data.slice(i * 1025, (i + 1) * 1025)
//     let checksum = 0

//     for (let j = 0; j < sendBuf.length; j++) {
//       checksum += sendBuf[j]
//     }
//     console.log(checksum.toString(16))
//     if (checksum.toString(16).length > 4) checksum = checksum.toString(16).slice(-4)
//     else checksum = checksum.toString(16)

//     // console.log(checksum)

//     const checksumBuf = new Buffer(checksum)
//     const len = headerBuf.length + sendBuf.length + checksumBuf.length
//     const arr = [headerBuf, sendBuf, checksumBuf]

//     const concatBuf = Buffer.concat(arr, len)
//     // sockets[bike_id_from_iot].write(concatBuf)
//   }

//   let lastBuffer = data.slice(max * 1025, data.length)
//   let lastCheckSum = 0
//   for (let i = 0; lastBuffer.length; i++) {
//     lastCheckSum += lastBuffer[i]
//   }

//   if (lastCheckSum.toString(16).length > 4) lastCheckSum = lastCheckSum.toString(16).slice(-4)
//   else lastCheckSum = lastCheckSum.toString(16)

//   const lastCheckSumBuf = new Buffer(lastCheckSum)

//   const lastLen = headerBuf.length + lastBuffer.length + lastCheckSumBuf.length
//   const lastArr = [headerBuf, lastBuffer, lastCheckSumBuf]
//   const lastConcatBuf = Buffer.concat(lastArr, lastLen)

//   // sockets[bike_id_from_iot].write(lastConcatBuf)
// })

// 서버 생성
var server = net.createServer(async function (socket) {
  const release1 = await mutex.acquire()
  try {
    // client로 부터 오는 data를 화면에 출력
    /* 
        Data 는 IoT 에서 받던, App 에서 받던 이래저래 같이 쓰이는 것이고
        아래 로직에서 차이가 나는 것이다.
    */
    // let bike_id_from_iot

    console.log(socket.address().address + ' Started Broonge IoT Server on ' + getCurrentTime())
    socket.setNoDelay(true)
    socket.setKeepAlive(true, 2000)

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
      })

      // client와 접속이 끊기는 메시지 출력
      socket.on('close', function () {
        // 연결을 끊는 socket이 sockets 안에 등록된 socket인지 판별한다.
        // const findBikeId = Object.entries(sockets).find(s => s[0] === bike_id_from_iot)
        // if (findBikeId) {
        //   console.log('bikeSocket disconnected')
        //   delete sockets[findBikeId[0]]
        //   console.log({ sockets })
        //   return
        // }
        // console.log('appSocket has left the IoT Server.')
        console.log('socket closed')
      })

      socket.on('data', async function (data) {
        const data_elements = data.toString('utf-8').trim()
        console.log(data_elements)
        // BR01486867506000147608930???????????????????????59903990725

        // console.log('연결된 자전거 ' + Object.keys(sockets))
        // IoT 로부터 받는 정보이다.
        const sig = data_elements.slice(0, sig_1)
        const group = data_elements.slice(sig_1, sig_2)
        const op_code = data_elements.slice(sig_2, sig_3)
        let size_4 = 10 // ID

        if (op_code == 4) size_4 = 15

        let size_5 = 3 // Version
        let size_6 = 2 // MSG Length
        let size_7 = 23 // GPS
        let size_8 = 1 // Signal Strength
        let size_9 = 2 // Battery
        let size_10 = 2 // Device Status
        let size_11 = 2 // Error Info
        let size_12 = 4 // Checksum
        let error_report_size = 2 //Error Report: “01”:Sig error “02”:Group error “03”:OP code error “04”:ID error “05”:chksum error

        // Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
        let sig_4 = sig_3 + size_4
        let sig_5 = sig_4 + size_5
        let sig_6 = sig_5 + size_6 //20
        let sig_7 = sig_6 + size_7 //43
        let sig_8 = sig_7 + size_8
        let sig_9 = sig_8 + size_9
        let sig_10 = sig_9 + size_10
        let sig_11 = sig_10 + size_11
        let sig_12 = sig_11 + size_12
        let sig_error_report = sig_6 + error_report_size

        const bike_id_from_iot = data_elements.slice(sig_3, sig_4)
        const version = data_elements.slice(sig_4, sig_5) // version 을 넣으니까 if 문에서 막힌다.
        const message_length = data_elements.slice(sig_5, sig_6)

        const f_1_gps = data_elements.slice(sig_6, sig_7)

        const f_2_signal_strength = data_elements.slice(sig_7, sig_8)
        const f_3_battery = data_elements.slice(sig_8, sig_9)
        const f_4_device_status = data_elements.slice(sig_9, sig_10)
        const f_5_err_info = data_elements.slice(sig_10, sig_11)
        const gps_reformatted = f_1_gps.split('N') // 이 부분이 IoT 좌표에서 넘어올 때 구분되어 지는 값이다.
        let f_1_lat = gps_reformatted[0].slice(0, 10) // 딱 10자리만 가져온다.
        let f_1_lng = gps_reformatted[1] ? gps_reformatted[1].slice(0, 11) : undefined

        const checksum = data_elements.slice(sig_11, sig_12)

        console.log('바이크 아이디', bike_id_from_iot)

        // 변경되는 값; 이 부분을 저장해야 한다.
        let manual_codes = f_1_gps + f_2_signal_strength + f_3_battery + f_4_device_status + f_5_err_info

        if (sig == process.env.IOT_SIG && group == process.env.IOT_GROUP && op_code == 4) {
          //IMEI로 통신
          const combined_manual_codes = manual_codes.split('')
          const manual_codes_value = combined_manual_codes
            .map(item => item.charCodeAt())
            .reduce((acc, curr) => acc + curr)
          let manual_codes_value_verification = '0' + manual_codes_value.toString(16)
          sockets[bike_id_from_iot] = socket

          console.log({ checksum, verification: manual_codes_value_verification })
          if (checksum === manual_codes_value_verification) {
            //bike_id_from_iot 는 IEMI 값
            const [findImei] = await (
              await connection()
            ).query('SELECT * FROM iot_status WHERE imei = ?', [bike_id_from_iot])

            if (findImei.length === 0) {
              const status =
                f_4_device_status === '03' ? 'malfunction' : f_4_device_status === '00' ? 'in_use' : 'stand_by'
              const is_locked = f_4_device_status === '03' ? 'malfunction' : f_4_device_status === '00' ? 'NO' : 'YES'

              await (
                await connection()
              ).query(
                `INSERT INTO iot_status SET bike_id = ?, imei = ?, battery = ?, lat = ?, lng = ?, signal_strength = ?, led = ?, status = ?, is_locked = ?, point =  ST_GeomFromText('POINT(? ?)')`,
                [
                  bike_id_from_iot,
                  bike_id_from_iot,
                  f_3_battery,
                  f_1_lat,
                  f_1_lng,
                  f_2_signal_strength,
                  'on',
                  status,
                  is_locked,
                  Number(f_1_lng),
                  Number(f_1_lat),
                ],
              )
            }

            let sig_for_app = process.env.IOT_SIG
            let group_for_app = process.env.IOT_GROUP
            let op_code_for_app = '3' // 3번이 보내는 경우이다.

            let version_for_app = 'APP'
            let message_length_for_app = '02' //IOT_ERROR_MESSAGE_LENGTH???
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
              let send_codes_manually_added_0x = '00' + send_codes_value_verification
              let final_send_codes = send_default_data_preparation + send_code + send_codes_manually_added_0x
              return final_send_codes
            }

            sockets[bike_id_from_iot].write(sending_codes('11')) //toUsim
          }
        } else if (sig == process.env.IOT_SIG && group == process.env.IOT_GROUP && op_code == 2) {
          //response
          //BR0128686750600014761223129999/090/02/00/0060 응답코드
          // ver/msgl/msg/checksum
          const imei = data_elements.slice(5, 20)
          const usim = data_elements.slice(20, 30)
          const message = data_elements.slice(35, 37)
          const checksum = data_elements.slice(37)
          const verification =
            '00' +
            message
              .split('')
              .reduce((acc, curr) => acc + curr.charCodeAt(), 0)
              .toString(16)

          if (checksum !== verification) return console.log('checksum diffrent')
          if (message !== '00') return console.log('response Error :' + message)

          const [findIMEI] = await (await connection()).query('SELECT * FROM iot_status WHERE imei = ? LIMIT 1', [imei])

          if (findIMEI.length !== 0) {
            await (
              await connection()
            ).query('UPDATE iot_status SET bike_id = ? WHERE bike_id = ? LIMIT 1', [usim, findIMEI[0].bike_id])
          }

          console.log('responseCode', { data_elements, imei, usim, message, checksum, verification })
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

          //TODO: 펌웨어 업그레이드 test
          if (bike_id_from_iot === '1223129999') {
            const data = fs.readFileSync('CH32V203C8T6.bin')
            const fileBuf = Buffer.from(data)
            const max = Math.floor(data.length / 1025)

            var sig_for_app = process.env.IOT_SIG
            var group_for_app = process.env.IOT_GROUP
            var op_code_for_app = '3' // 3번이 보내는 경우이다.

            var version_for_app = 'APP'
            var message_length_for_app = '1024' //IOT_ERROR_MESSAGE_LENGTH???
            var send_default_data_preparation =
              sig_for_app +
              group_for_app +
              op_code_for_app +
              bike_id_from_iot +
              version_for_app +
              message_length_for_app

            //   const headerBuf = Buffer.from(send_default_data_preparation)
            //   for (let i = 0; i < max; i++) {
            //     const sendBuf = data.slice(i * 1025, (i + 1) * 1025)
            //     let checksum = 0

            //     for (let j = 0; j < sendBuf.length; j++) {
            //       checksum += sendBuf[j]
            //     }

            //     if (checksum.toString(16).length > 4) checksum = checksum.toString(16).slice(-4)
            //     else checksum = checksum.toString(16)

            //     const checksumBuf = Buffer.from(checksum)
            //     const len = headerBuf.length + sendBuf.length + checksumBuf.length
            //     const arr = [headerBuf, sendBuf, checksumBuf]

            //     const concatBuf = Buffer.concat(arr, len)
            //     sockets[bike_id_from_iot].write(concatBuf)
            //   }

            let lastBuffer = fileBuf.slice(max * 1025, data.length)
            // let lastCheckSum = 0
            // for (let i = 0; lastBuffer.length; i++) {
            //   lastCheckSum += lastBuffer[i]
            // }

            // if (lastCheckSum.toString(16).length > 4) lastCheckSum = lastCheckSum.toString(16).slice(-4)
            // else lastCheckSum = lastCheckSum.toString(16)

            // const lastCheckSumBuf = Buffer.from(lastCheckSum)

            // const lastLen = headerBuf.length + lastBuffer.length + lastCheckSumBuf.length
            // const lastArr = [headerBuf, lastBuffer, lastCheckSumBuf]
            // const lastConcatBuf = Buffer.concat(lastArr, lastLen)
            console.log(lastBuffer)

            // sockets[bike_id_from_iot].write(lastConcatBuf)
            return
          }

          if (checksum == manually_added_0x) {
            // IoT 로 부터 받은 값이 모두 문제 없이 다 통과했을 때 실행
            try {
              console.log({ bikeId: bike_id_from_iot, data: data_elements }, getCurrentTime())

              //to IMEI test
              // if (bike_id_from_iot === '1223129999') {
              //   let sig_for_app = process.env.IOT_SIG
              //   let group_for_app = process.env.IOT_GROUP
              //   let op_code_for_app = '3' // 3번이 보내는 경우이다.

              //   let version_for_app = 'APP'
              //   let message_length_for_app = '02' //IOT_ERROR_MESSAGE_LENGTH???
              //   let send_default_data_preparation =
              //     sig_for_app +
              //     group_for_app +
              //     op_code_for_app +
              //     bike_id_from_iot +
              //     version_for_app +
              //     message_length_for_app

              //   function sending_codes(send_code) {
              //     let combined_send_codes = send_code.split('')
              //     let send_codes_value = combined_send_codes
              //       .map(item => item.charCodeAt())
              //       .reduce((acc, curr) => acc + curr)
              //     let send_codes_value_verification = send_codes_value.toString(16)
              //     let send_codes_manually_added_0x = '00' + send_codes_value_verification
              //     let final_send_codes = send_default_data_preparation + send_code + send_codes_manually_added_0x
              //     return final_send_codes
              //   }

              //   sockets[bike_id_from_iot].write(sending_codes('10'))
              //   return
              // }

              //자전거가 보낸 통신일 경우
              //DB에 해당 자전거 ID가 등록되어 있는지 확인
              const findBikeInIotStatusQuery = `SELECT * FROM iot_status WHERE bike_id = ? limit 1`
              const [findBikeInIotStatus] = await (
                await connection()
              ).query(findBikeInIotStatusQuery, [bike_id_from_iot])

              if (findBikeInIotStatus.length === 0) {
                console.log('등록되지 않은 자전거입니다.')
                return
              }

              if (gps_reformatted.length === 1 && findBikeInIotStatus) {
                f_1_lng = findBikeInIotStatus[0].lng
                f_1_lat = findBikeInIotStatus[0].lat
              }

              const findBikeInBikesQuery = `SELECT * FROM bikes WHERE id = ? limit 1`
              const [findBikeInBikes] = await (await connection()).query(findBikeInBikesQuery, [bike_id_from_iot])

              //TODO: 자전거가 bikes 와 iot 동시에 없거나 있어도 bikes is_active 가 NO 이면 소켓을 끊어야 한다.
              // `SELECT id FROM bikes AS b JOIN iot_status AS iot ON iot.bike_id = b.id WHERE b.is_active = 'YES'`

              const partQuery =
                f_4_device_status === '03'
                  ? `status = 'malfunction', is_locked = 'malfunction'`
                  : f_4_device_status === '00' // 00 이 해제상태
                  ? `status = 'in_use', is_locked = 'NO'`
                  : f_4_device_status === '01' // 01 이 잠긴상태
                  ? `status = 'stand_by', is_locked = 'YES'`
                  : `status = 'stand_by', is_locked = 'NO'` // 문제가 발생했다는 의미..? @DBJ on 20221213
              const updateBikeStatusQuery = `UPDATE iot_status SET battery = ?, lat = ?, lng = ?, signal_strength = ?, point = ST_GeomFromText('POINT(? ?)'), ${partQuery} WHERE bike_id = ?`
              const [result] = await (
                await connection()
              ).query(updateBikeStatusQuery, [
                f_3_battery,
                f_1_lat,
                f_1_lng,
                f_2_signal_strength,
                Number(f_1_lng),
                Number(f_1_lat),
                bike_id_from_iot,
              ])

              if (
                bike_id_from_iot == '1241212319' ||
                bike_id_from_iot == '1223129999' ||
                bike_id_from_iot == '1223135543' ||
                bike_id_from_iot == '1221326819' ||
                bike_id_from_iot == '1223146045' ||
                bike_id_from_iot == '1223130861'
              ) {
                if (result.changedRows == 0) {
                  duplicateGPS[bike_id_from_iot]
                    ? (duplicateGPS[bike_id_from_iot] += 1)
                    : (duplicateGPS[bike_id_from_iot] = 1)
                }
                console.log('같은 값이 온 횟수', JSON.stringify(duplicateGPS[bike_id_from_iot], null, 2))
              }

              if (f_4_device_status === '00') {
                const selectBikeRiding = `SELECT * FROM riding_data WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
                const [selectResult] = await (await connection()).query(selectBikeRiding, [bike_id_from_iot])

                let coordinates = []
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
                  // console.log(
                  //   '마지막 위치 : ' +
                  //     coordinates[coordinates.length - 1].lat +
                  //     ' , ' +
                  //     coordinates[coordinates.length - 1].lng,
                  // )
                  // console.log('현재위치 : ' + f_1_lat + ' , ' + f_1_lng)
                  // console.log({ dist })

                  if (distPoints === 0) {
                    // console.log('위치변화가 없습니다.')
                    return
                  } else {
                    dist += distPoints
                  }
                }

                coordinates = [...coordinates, { lat: Number(f_1_lat), lng: Number(f_1_lng) }]

                const updateBikeRiding = `UPDATE riding_data set coordinates = ?, distance = ? WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
                await (
                  await connection()
                ).query(updateBikeRiding, [JSON.stringify(coordinates), dist.toFixed(3), bike_id_from_iot])
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
          var bike_id_for_app = app_to_iot_data[1]
          var version_for_app = 'APP'
          var message_length_for_app = '02' //IOT_ERROR_MESSAGE_LENGTH???
          var send_default_data_preparation =
            sig_for_app + group_for_app + op_code_for_app + bike_id_for_app + version_for_app + message_length_for_app

          function sending_codes(send_code) {
            var combined_send_codes = send_code.split('')
            var send_codes_value = combined_send_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr)
            var send_codes_value_verification = send_codes_value.toString(16)
            var send_codes_manually_added_0x = '00' + send_codes_value_verification
            var final_send_codes = send_default_data_preparation + send_code + send_codes_manually_added_0x
            return final_send_codes
          }

          async function updateBikeStatus(order) {
            const code = order === 'unlock' ? '01' : order === 'page' ? '02' : '03'
            if (!code) return socket.write('not order')

            if (beforeSendBikeId === bike_id_for_app) await new Promise(resolve => setTimeout(resolve, 1000))

            sockets[bike_id_for_app].write(sending_codes(code))
            beforeSendBikeId = bike_id_for_app

            socket.write(sending_codes(code))
            socket.write('   ') // App 한테 보내는 것
            socket.write(getCurrentTime())
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
      console.log('--------------------finally execute-----------------------')
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

// 에러가 발생할 경우 화면에 에러메시지 출력

server.on('error', function (err) {
  console.log('server err' + err)
})

// .env 의 포트값으로 진행되던가 아니면 9090 으로 진행되던가 해서 접속이 가능하도록 대기
// @DBJ 여기 안나오는데?
server.listen(IOT_PORT, function () {
  console.log(`Listening for requests on port ${IOT_PORT}`)
})

/*
3자리이면 앞에 0 한개 붙이시고,,,,,2자리 나오면 앞에 0 2개 이렇게

checksum length 를 count 하고,
실제 계산된 값의 length 를 구한다음,
그 length 에 있어서 자리수가 부족한 경우에는 0으로 매꾼다???

*/
