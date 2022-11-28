const net = require('net');
const port = 9090;
const host = '127.0.0.1';
var mariadb = require('mariadb');

const conn = mariadb.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'Nc_02075!!',
    database: 'broonge'
});

const server = net.createServer();
server.listen(port, host, () => {
    console.log('API server is running on port ' + port + '.');
    //console.log(conn);

});

let sockets = [];
server.on('connection', function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);


    sockets.push(sock);

    sock.on('data', function(data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
            // conn.query(`SELECT * FROM test WHERE id = ${data}`, (err, rows) => {
            //     if (err) console.log("DB connection failed: " + err);
            //     else {
            //         // console.log(rows[0].item_price);
            //         //sock.write('hehe');
            //         var i;
            //         for (i = 0; i < 5; i++) {
            //             sock.write(JSON.stringify(rows[i]));
            //             //sock.write(rows[i]);
            //         }
            //         // console.log(rows[0]);
            //     }
            // });
            const str_array = data.toString().split(',');
  
            for(var i = 0; i < str_array.length; i++) {
                // Trim the excess whitespace.
                str_array[i] = str_array[i].replace(/^\s*/, "").replace(/\s*$/, "");
                // Add additional code here, such as:
            }
            
            conn.query(`insert into test (data_0, data_1, data_2, data_3, data_4, data_5, data_6, data_7, data_8, data_9)
            values(?,?,?,?,?,?,?,?,?,?)`,
            [str_array[0], str_array[1], str_array[2], str_array[3], str_array[4], str_array[5], str_array[6], str_array[7], str_array[8], str_array[9]]
            )
        // Write the data back to all the connected, the client will receive it as data from the server
            sock.write("hello");
    });

    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        let index = sockets.findIndex(function(o) {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })
        if (index !== -1) sockets.splice(index, 1);
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });
});

process.on('uncaughtException', function (err) {
    console.error(err);
    //console.log("Client disconnected");
  });