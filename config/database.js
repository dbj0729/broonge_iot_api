// config/database.js

const mysql = require("mysql2/promise");

const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.MYSQL_DB,
  connectionLimit: 2,
  waitForConnections: true,
  queueLimit: 0,
  keepAliveInitialDelay: 10000, // 0 by default.
  enableKeepAlive: true, // false by default.
  dateStrings: 'date'
};

var connect = null;

module.exports = {
    connection: async()=>{
      if(connect == null) {
        connect = await mysql.createPool(options);
        return connect;
      }else {
        return connect;
      }
  }
}
