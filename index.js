const net = require('net');

const server = net.createServer(conn => {
    console.log('new client');
    conn.write('Welcome!'+'\r\n');
    conn.on ('data', data => {
        // conn.write(data + '\r\n');
        console.log(data);
        console.log(data.toString());
        conn.write("I've got your message: "+data+'\r\n')
    });
    
    conn.on('end', () => {
        console.log('client left');
    });
    
});

server.listen(9090);


