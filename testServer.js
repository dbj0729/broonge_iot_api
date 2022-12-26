require('dotenv').config()
const net = require('net')
const { iotProcess } = require('./functions/iotProcess')
const { convertData, sendingCode } = require('./functions/convertData')

let gps_obj = {}
const connectedBikeSocket = new Set()

const server = net.createServer(async socket => {
  console.log('connected socket' + socket.remoteAddress + socket.remotePort)
  let bike_id_from_iot

  socket.on('data', async data => {
    const data_elements = data.toString('utf-8').trim()
    const {
      sig,
      group,
      op_code,
      bikeId,
      version,
      message_length,
      f_1_lat,
      f_1_lng,
      f_2_signal_strength,
      f_3_battery,
      f_4_device_status,
      f_5_err_info,
      checksum,
      manual_codes,
      verifyingCode,
      error_report_code,
    } = convertData(data_elements)

    bike_id_from_iot = bikeId

    if (
      sig == process.env.IOT_SIG &&
      group == process.env.IOT_GROUP &&
      op_code == process.env.IOT_ERROR_OP_CODE &&
      message_length == process.env.IOT_ERROR_MESSAGE_LENGTH
    )
      console.log('ERROR_REPORT_CODE:' + error_report_code)
    else if (
      sig == process.env.IOT_SIG &&
      group == process.env.IOT_GROUP &&
      op_code == process.env.IOT_OP_CODE &&
      message_length == process.env.IOT_MESSAGE_LENGTH &&
      manual_codes.length !== 0
    ) {
      socket.bikeId = bike_id_from_iot
      connectedBikeSocket.add(socket)

      gps_obj = iotProcess(
        checksum,
        verifyingCode,
        bike_id_from_iot,
        f_1_lat,
        f_1_lng,
        f_2_signal_strength,
        f_3_battery,
        f_4_device_status,
        gps_obj,
      )
    } else {
      // a001, 자전거 번호, unlock...
      let app_to_iot_data = data_elements.split(',')
      let op_code_for_app = '3'
      let bike_id_for_app = app_to_iot_data[1]
      let version_for_app = 'V0.85'
      let message_length_for_app = '02'
      let send_default_data_preparation =
        process.env.IOT_SIG +
        process.env.IOT_GROUP +
        op_code_for_app +
        bike_id_for_app +
        version_for_app +
        message_length_for_app

      async function updateBikeStatus(order) {
        const code = order === 'lock' ? '01' : order === 'unlock' ? '00' : order === 'page' ? '02' : null
        if (!code) return socket.write('not order')

        for (let sock of connectedBikeSocket) {
          if (sock.bikeId === bike_id_for_app) {
            sock.write(sendingCode(code, send_default_data_preparation))
            sock.pause()
            setTimeout(() => sock.resume(), 400)
            socket.write(sendingCode(code, send_default_data_preparation))
            socket.write('   ') // App 한테 보내는 것
            socket.write(getCurrentTime())
            socket.destroy()
          }
        }
      }

      if (app_to_iot_data[0] == process.env.APP_SIG) {
        if (!app_to_iot_data[2]) {
          console.log('appSocket : data parsing error')
          socket.write('something wrong')
        } else {
          await updateBikeStatus(app_to_iot_data[2])
        }
      } else {
        socket.write('sorry, no bike')
      }
    }
  })

  socket.on('error', err => console.log(err))

  socket.on('close', () => console.log('socket connection closed'))
})

server.on('error', err => console.log(err))
server.on('close', () => console.log('Server Closed'))

server.listen(process.env.IOT_PORT, () => {
  console.log(`Server Listening on Port ${process.env.IOT_PORT}`)
  console.log(new Date().toLocaleString('ko-KR'))
})
