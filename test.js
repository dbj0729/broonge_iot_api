const net = require('net')
require('dotenv').config()
const IOT_PORT = 9090

const server = net.createServer(socket => {
  socket.on('data', data => {
    const receiveData = data.toString('utf-8').trim()
    console.log(receiveData, new Date().toLocaleTimeString())

    socket.write('ok')
  })
})

server.on('error', function (err) {
  console.log('err' + err)
})

server.listen(IOT_PORT, function () {
  console.log(`Listening for requests on port ${IOT_PORT}`)
})
