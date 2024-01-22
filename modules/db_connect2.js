const mysql = require('mysql2');

//建立連線池pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'proj57',
    waitForConnections: true,
    //連線最大數量
    connectionLimit: 5,
    // 限定排隊人數
    queueLimit: 0,
});

// 匯出 promise pool
module.exports = pool.promise();