const net = require('net');
console.log(date);
const server = net.createServer(conn => {
    console.log('new client');
    conn.write('Welcome!'+'\r\n');
    conn.on ('data', data => {
        // conn.write(data + '\r\n');
        console.log(data);
        console.log(data.toString());
        conn.write("I've got your message: "+data+'\r\n')
        // const data2 = `hello`;
        // const data_preparation = data2;
        // const a = data_preparation.slice(1,3);
        // console.log(a);
    
    });


    conn.on('end', () => {
        console.log('client left');
    });

});