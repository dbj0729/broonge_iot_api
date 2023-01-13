const net = require('net')
require('dotenv').config()
const IOT_PORT = process.env.IOT_PORT || '8000'

const server = net.createServer(socket => {
  socket.on('data', data => console.log(data))
})

server.on('error', function (err) {
  console.log('err' + err)
})

server.listen(IOT_PORT, function () {
  console.log(`Listening for requests on port ${IOT_PORT}`)
})
