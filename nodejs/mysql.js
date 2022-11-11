const mysql = require('mysql');
const connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'root',
    password: 'Yeol1234%',
    database: 'test'
});

connection.connect();

connection.query();

connection.end();