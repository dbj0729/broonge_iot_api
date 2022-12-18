var net = require('net')
// const readlinePromises = require("node:readline");
// const rl = readlinePromises.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });
function getCurrentTime() {
  const datetime = new Date().toLocaleString('ko-KR')
  const result = String(datetime)
  console.log(result)
  return result
}
console.log(getCurrentTime())
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

var Buffer = require('buffer/').Buffer

require('dotenv').config()
const { connection } = require('./config/database')

const IOT_PORT = process.env.IOT_PORT || '9090'

let gps_obj = {}
const distance_value = 0

// IoT 에서 받는 Header byte size
let size_1 = 4 // Sig.
let size_2 = 4 // Group
let size_3 = 1 // OP Code
let size_4 = 10 // ID
let size_5 = 5 // Version
let size_6 = 2 // MSG Length
let size_7 = 23 // GPS
let size_8 = 1 // Signal Strength
let size_9 = 2 // Battery
let size_10 = 2 // Device Status
let size_11 = 2 // Error Info
let size_12 = 4 // Checksum
let error_report_size = 2 //Error Report: “01”:Sig error “02”:Group error “03”:OP code error “04”:ID error “05”:chksum error

// Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
let sig_1 = size_1
let sig_2 = sig_1 + size_2
let sig_3 = sig_2 + size_3
let sig_4 = sig_3 + size_4
let sig_5 = sig_4 + size_5
let sig_6 = sig_5 + size_6
let sig_7 = sig_6 + size_7
let sig_8 = sig_7 + size_8
let sig_9 = sig_8 + size_9
let sig_10 = sig_9 + size_10
let sig_11 = sig_10 + size_11
let sig_12 = sig_11 + size_12
let sig_error_report = sig_6 + error_report_size

let sockets = {}
// 서버 생성
var server = net.createServer(function (socket) {
  console.log(socket.address().address + 'Started Broonge IoT Server on ' + getCurrentTime())

  // socket.setEncoding('utf8')
  socket.setNoDelay(true)

  // client로 부터 오는 data를 화면에 출력
  /* 
        Data 는 IoT 에서 받던, App 에서 받던 이래저래 같이 쓰이는 것이고
        아래 로직에서 차이가 나는 것이다.
    */
  socket.on('data', async function (data) {
    console.log('Received Data: ' + data)
    console.log('sockets key list before', Object.keys(sockets))

    const data_elements = data.toString('utf-8').trim()

    // IoT 로부터 받는 정보이다.
    const sig = data_elements.slice(0, sig_1)
    const group = data_elements.slice(sig_1, sig_2)
    const op_code = data_elements.slice(sig_2, sig_3)
    const bike_id_from_iot = data_elements.slice(sig_3, sig_4)
    const version = data_elements.slice(sig_4, sig_5) // version 을 넣으니까 if 문에서 막힌다.
    const message_length = data_elements.slice(sig_5, sig_6)

    const f_1_gps = data_elements.slice(sig_6, sig_7)
    const f_2_signal_strength = data_elements.slice(sig_7, sig_8)
    const f_3_battery = data_elements.slice(sig_8, sig_9)
    const f_4_device_status = data_elements.slice(sig_9, sig_10)
    const f_5_err_info = data_elements.slice(sig_10, sig_11)
    const gps_reformatted = f_1_gps.split('N') // 이 부분이 IoT 좌표에서 넘어올 때 구분되어 지는 값이다.
    const f_1_lat = gps_reformatted[0].slice(0, 10) // 딱 10자리만 가져온다.
    const f_1_lng = gps_reformatted[1] ? gps_reformatted[1].slice(0, 11) : undefined

    const checksum = data_elements.slice(sig_11, sig_12)

    if (sockets[bike_id_from_iot]) console.log('bikeSocketStatus', sockets[bike_id_from_iot].readyState)

    // 변경되는 값; 이 부분을 저장해야 한다.
    let manual_codes = f_1_gps + f_2_signal_strength + f_3_battery + f_4_device_status + f_5_err_info

    if (
      sig == process.env.IOT_SIG &&
      group == process.env.IOT_GROUP &&
      op_code == process.env.IOT_ERROR_OP_CODE &&
      message_length == process.env.IOT_ERROR_MESSAGE_LENGTH
    ) {
      const error_report_code = data_elements.slice(sig_6, sig_error_report)
      console.log('ERROR_REPORT_CODE:' + error_report_code)
    } else if (
      sig == process.env.IOT_SIG &&
      group == process.env.IOT_GROUP &&
      op_code == process.env.IOT_OP_CODE &&
      message_length == process.env.IOT_MESSAGE_LENGTH &&
      manual_codes.length !== 0
    ) {
      const combined_manual_codes = manual_codes.split('') // data 에서 온 raw 값을 글자 단위로 쪼갠 결과
      const manual_codes_value = combined_manual_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr) // 쪼갠 결과를 하나씩 분배

      // IoT 에서 보낸 값이 누락없이 잘 왔는지 모든 글자의 ASCII 코드 값을 다 더한 후 16진수로 변환해서
      // IoT 보냈던 Checksum 값과 동일한지를 확인하고 동일해야지만 서버에 저장된다.
      // 만약, Checksum 이 다른 경우에는 데이터를 버려버린다. IoT 에 Return 할 필요는 없다.
      // 단, 만약, 20회 이상 Checksum 오류가 나는 경우에는 관리자에게 안내를 해 줘야 한다.
      manual_codes_value_verification = manual_codes_value.toString(16) // 분배된 값을 16진수로 변경

      manually_added_0x = '0' + manual_codes_value_verification // 마지막 checksum 에 0이 빠져서 0을 넣음

      if (!sockets[bike_id_from_iot]) sockets[bike_id_from_iot] = socket

      if (checksum == manually_added_0x) {
        // IoT 로 부터 받은 값이 모두 문제 없이 다 통과했을 때 실행
        try {
          //자전거가 보낸 통신일 경우
          //DB에 해당 자전거 ID가 등록되어 있는지 확인
          const findBikeQuery = `SELECT * FROM iot_status WHERE bike_id = ? limit 1`
          var [findBike] = await (await connection()).query(findBikeQuery, [bike_id_from_iot])

          if (findBike.length === 0) socket.destroy() // 등록된 자전거가 없을 경우 소켓을 끊는다.
          else {
            const partQuery =
              f_4_device_status === '03'
                ? `status = 'malfunction', is_locked = 'malfunction'`
                : f_4_device_status === '00' // 00 이 해제상태
                ? `status = 'in-use', is_locked = 'NO'`
                : f_4_device_status === '01' // 01 이 잠긴상태
                ? `status = 'stand_by', is_locked = 'YES'`
                : `status = 'stand_by', is_locked = 'NO'` // 문제가 발생했다는 의미..? @DBJ on 20221213
            const updateBikeStatusQuery = `UPDATE iot_status SET battery = ?, lat = ?, lng = ?, signal_strength = ?, point = ST_GeomFromText('POINT(? ?)'), ${partQuery} WHERE bike_id = ?`
            const result = await (
              await connection()
            ).query(updateBikeStatusQuery, [
              f_3_battery,
              f_1_lat,
              f_1_lng,
              f_2_signal_strength,
              Number(f_1_lat),
              Number(f_1_lng),
              bike_id_from_iot,
            ])
            // console.log('update result: ', JSON.stringify(result, null, 2))
            console.log('bikeSocket: Update iot_status table complete!')
            if (f_4_device_status === '00') {
              // IoT 가 이용자가 누구인지도 쏴 주면 좋을 것 같긴한데................. @DBJ on 221213
              let gps_array = []
              if (gps_obj[bike_id_from_iot]) gps_array = gps_obj[bike_id_from_iot]
              const gps_object = { lat: Number(f_1_lat), lng: Number(f_1_lng) }
              gps_array.push(gps_object)
              gps_obj[bike_id_from_iot] = gps_array
              let last = gps_array[gps_array.length - 2]
              if (last == null) {
                console.log('Received the first gps coordinates.')
                previous_distance = 0
              } else {
                console.log(last)
                console.log('Current Value: ' + f_1_lat + ',' + f_1_lng)
                console.log('Previous Value: ' + last.lat + ',' + last.lng)
                let distance_value = distance(f_1_lat, f_1_lng, Number(last.lat), Number(last.lng), 'K')
                // 여기서는 거리 누적을 더할 때 Array 로 하는 것보다는 Function 으로 돌려야 한다.
                // For 문 같은 건 들어올 수 없다. 언제 끝날지 모르기 때문이다.
                // previous 1은 한 loop 를 돌기 전의 값이고, previous 2 와 distance_value 가 더해지는 것이다. @DBJ on 221213
                console.log('previous 1: ' + previous_distance) // c
                const distance_sum_value = distance_sum(previous_distance, distance_value) // c+d
                distance_value_result = distance_sum_value // e
                previous_distance = distance_value_result // e

                console.log('previous 2: ' + previous_distance)
                console.log('current: ' + distance_value)
                // 아래 주석 부분은 매번 GPS 가 업데이트 될 때이다.
                // const updateBikeStatusQuery2 = `UPDATE riding_data SET coordinates = ?, distance = ? WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
                const updateBikeStatusQuery2 = `UPDATE riding_data SET distance = ? WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
                const result2 = await (
                  await connection()
                ).query(updateBikeStatusQuery2, [
                  // JSON.stringify(gps_array), // 건마다 업데이트 된 GPS 정보를 담는다.
                  distance_value_result.toFixed(7),
                  bike_id_from_iot,
                ])
                console.log(result2)
                console.log('THIS ONE MAYBE: ' + JSON.stringify(gps_array))
                console.log(gps_array)
                console.log('TOTAL DISTANCE: ' + distance_value_result.toFixed(7) + ' FOR: ' + bike_id_from_iot)
                // console.log('update result 2: ', JSON.stringify(result, null, 2))
              }
            } else {
              // 한번에 update 하는 자리
              delete gps_obj[bike_id_from_iot]
              // console.log('gps_array :' + gps_array)
              console.log('GPS array has been reset.')
            }
          }
        } catch (error) {
          console.log(error)
        }
      } else {
        try {
          delete sockets[bike_id_from_iot]
          socket.destroy()
          console.log(`bikeSocket: Wrong type of data transaction.`) // 상기 횟수에 따라 오류가 발생할 경우, 관리자 Alert 를 띄워야 한다.
        } catch (error) {
          console.error(error)
        }
      }
    } else {
      // 이 부분이 IoT 로 보내기 위해 App 으로부터 받는 부분이다.

      // App 에서 IoT 로 보내기 위해 받는 Protocol
      // a001, 자전거 번호, unlock...
      let app_to_iot_data = data_elements.split(',')

      // App 에서 IoT 로 정보를 보내기 위한 기본 변수들이다.
      var sig_for_app = process.env.IOT_SIG
      var group_for_app = process.env.IOT_GROUP
      var op_code_for_app = '3' // 3번이 보내는 경우이다.
      var bike_id_for_app = app_to_iot_data[1]
      var version_for_app = 'V0.50'
      var message_length_for_app = '02'
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
        const code = order === 'lock' ? '00' : order === 'unlock' ? '01' : order === 'page' ? '02' : null
        if (!code) return socket.write('not order')
        // if (code === '00' || code === '01') {
        //   const updateBikeStatusQuery = `UPDATE iot_status SET is_locked = ? WHERE bike_id = ?`
        //   await (await connection()).execute(updateBikeStatusQuery, [code === '00' ? 'YES' : 'NO', bike_id_for_app])
        // }
        console.log({ toBikeCode: sending_codes(code) })
        console.log('appSocket : order is ' + order)
        sockets[app_to_iot_data[1]].write(sending_codes(code)) // 이 부분이 의심
        socket.write(sending_codes(code)) // App 한테 보내는 것
        socket.write(getCurrentTime())
      }

      if (app_to_iot_data[0] == process.env.APP_SIG && sockets[app_to_iot_data[1]]) {
        if (!app_to_iot_data[2]) {
          console.log('appSocket : data parsing error')
          socket.write('something wrong')
        } else {
          updateBikeStatus(app_to_iot_data[2])
        }
      } else {
        socket.write('sorry, no bike')
      }
    }
  })

  // client와 접속이 끊기는 메시지 출력
  socket.on('close', function () {
    // 연결을 끊는 socket이 sockets 안에 등록된 socket인지 판별한다.
    const findBikeId = Object.entries(sockets).find(s => s[1] === socket)
    if (findBikeId) {
      console.log('bikeSocket disconnected')
      delete sockets[findBikeId[0]]
      return
    }
    console.log('appSocket has left the IoT Server.')
  })
  // client가 접속하면 화면에 출력해주는 메시지
  socket.write('Welcome')
})

// 에러가 발생할 경우 화면에 에러메시지 출력
server.on('error', function (err) {
  console.log('err' + err)
})

// .env 의 포트값으로 진행되던가 아니면 9090 으로 진행되던가 해서 접속이 가능하도록 대기
server.listen(IOT_PORT, function () {
  console.log(`Listening for requests on port ${IOT_PORT}`)
})

/*
3자리이면 앞에 0 한개 붙이시고,,,,,2자리 나오면 앞에 0 2개 이렇게

checksum length 를 count 하고,
실제 계산된 값의 length 를 구한다음,
그 length 에 있어서 자리수가 부족한 경우에는 0으로 매꾼다???

*/
// @DBJ 새롭게 추가해서 혹시나 해서...
console.log('sockets key list after', Object.keys(sockets))
