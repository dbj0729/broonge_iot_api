var net = require('net')
// const readlinePromises = require("node:readline");
// const rl = readlinePromises.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

var Buffer = require('buffer/').Buffer

require('dotenv').config()
const { connection } = require('./config/database')

const IOT_PORT = process.env.IOT_PORT || '9090'

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
let bikeSocket
// 서버 생성
var server = net.createServer(function (socket) {
  console.log(socket.address().address + 'Started Broonge IoT Server')

  // socket.setEncoding('utf8')
  socket.setNoDelay(true)

  // client로 부터 오는 data를 화면에 출력
  /* 
        Data 는 IoT 에서 받던, App 에서 받던 이래저래 같이 쓰이는 것이고
        아래 로직에서 차이가 나는 것이다.
    */
  socket.on('data', async function (data) {
    console.log('Received Data: ' + data)
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
    const f_1_lng = gps_reformatted[0].slice(0, 10) // 딱 10자리만 가져온다.

    const checksum = data_elements.slice(sig_11, sig_12)

    // 변경되는 값; 이 부분을 저장해야 한다.
    let manual_codes = f_1_gps + f_2_signal_strength + f_3_battery + f_4_device_status + f_5_err_info

    //TODO: [X] 32 buffer 없애기... char 로 바꿔서 보내야 할 듯..? 혹은 buffer 로?
    //TODO: [O] error 하수구... IOT_ERROR ~~~ 을 넣어서 처리함... 나머지 부분도 이렇게 만들어야 할 듯
    //TODO: [O] data 값이 정상적으로 모두 다 들어왔는지 확인 후 정상데이타가 아니면 소켓 연결 끊기
    //          --> 1934BR0111241212318V0.503037.2114350N127.0894533E5990000062a 을
    //          --> 1934BR0111241212318V0.503037.2114350N127.0894533E5990000062 로 넣으면 Wrong... 으로 나옴 즉, manual_codes 랑 checksum 이 안 맞으면 예외처리함.
    //TODO: [x] 정상데이터면 iot socket 인지 app socket 인지 확인 후 처리... sockets[bike_id_from_iot].socket 을 필요한 곳에만 넣었음
    //          --> 테스트 방식 ==> 터미널에서 아이디 다른 값으로 먼저 넣어본 후 sockets 에 그 아이디가 붙었을 때 aaaaaaaaaaaaaaaaaaaaaaaaaa 를 넣으면
    //          통신 두절되고 그 아이디 다른 값은 sockets 에서 사라짐 (원래는 저 aaaaaaaaaa 가 아이디 다른 값을 치환하였음).
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

      /* 
      console.log({ manual_codes_value });
      consollog(manual_codes_value.toString(16));
      console.log("here is the checksum:" + checksum);
      */

      // IoT 에서 보낸 값이 누락없이 잘 왔는지 모든 글자의 ASCII 코드 값을 다 더한 후 16진수로 변환해서
      // IoT 보냈던 Checksum 값과 동일한지를 확인하고 동일해야지만 서버에 저장된다.
      // 만약, Checksum 이 다른 경우에는 데이터를 버려버린다. IoT 에 Return 할 필요는 없다.
      // 단, 만약, 20회 이상 Checksum 오류가 나는 경우에는 관리자에게 안내를 해 줘야 한다.
      manual_codes_value_verification = manual_codes_value.toString(16) // 분배된 값을 16진수로 변경

      manually_added_0x = '0' + manual_codes_value_verification // 마지막 checksum 에 0이 빠져서 0을 넣음

      sockets[bike_id_from_iot] = socket

      if (checksum == manually_added_0x) {
        // IoT 로 부터 받은 값이 모두 문제 없이 다 통과했을 때 실행
        try {
          //자전거가 보낸 통신일 경우
          //DB에 해당 자전거 ID가 등록되어 있는지 확인
          const findBikeQuery = `SELECT * FROM iot_status WHERE bike_id = ? limit 1`
          var [findBike] = await (await connection()).execute(findBikeQuery, [bike_id_from_iot])

          if (findBike.length === 0) {
            socket.destroy() // 등록된 자전거가 없을 경우 소켓을 끊는다.
          } else {
            const updateBikeStatusQuery = `
                      UPDATE iot_status SET 
                          battery = ${f_3_battery},
                          lat = ${f_1_lat},
                          lng = ${f_1_lng},
                          signal_strength = ${f_2_signal_strength},
                          led = "on",
                          status = 'current status'
                          WHERE bike_id = ?`
            await (await connection()).execute(updateBikeStatusQuery, [bike_id_from_iot])
            // sockets[bike_id_from_iot].write('Welcome! ' + bike_id_from_iot)
            console.log('bikeSocket: Update iot_status table complete!')
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
        // final_send_codes_buffer = Buffer.from(final_send_codes, 'utf-8')
        // const buf = Buffer.alloc(100)
        // final_send_codes_buffer = buf.write(final_send_codes)
        return final_send_codes
      }

      async function updateBikeStatus(order) {
        const code = order === 'lock' ? '00' : order === 'unlock' ? '01' : order === 'page' ? '02' : null
        if (!code) return socket.write('not order')
        const updateBikeStatusQuery = `UPDATE iot_status SET status = ? WHERE bike_id = ?`
        await (await connection()).execute(updateBikeStatusQuery, [order, bike_id_for_app])
        console.log({ toBikeCode: sending_codes(code) })
        console.log('appSocket : order is ' + order)
        sockets[app_to_iot_data[1]].write(sending_codes(code))
        socket.write(order)
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
  // socket.write('Welcome')
})

// 에러가 발생할 경우 화면에 에러메시지 출력
server.on('error', function (err) {
  if (bikeSocket) delete sockets[bike_id_from_iot]
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
