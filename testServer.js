const net = require('net')

const server = net.createServer(async socket => {
  console.log('connected socket' + socket.remoteAddress + socket.remotePort)

  socket.on('data', async data => {
    console.log('echo server send to iot : ' + data)
    socket.write(data)
  })

  socket.on('error', err => console.log(err))

  socket.on('close', () => console.log('socket connection closed'))
})

server.on('error', err => console.log(err))
server.on('close', () => console.log('Server Closed'))

server.listen(9090, () => {
  console.log('Server Listening on Port 9090')
})
