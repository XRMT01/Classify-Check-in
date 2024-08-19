// db.jsx
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function getConnection() {
    return await pool.getConnection();
}

async function queryOne(sql) {
    const connection = await getConnection();
    const [rows] = await connection.query(sql);
    connection.release();
    if (rows && rows.length > 0) {
        return rows[0];
    } else {
        return null;
    }
}

async function querySql(sql) {
    const connection = await getConnection();
    const [rows] = await connection.query(sql);
    connection.release();
    return rows;
}

// 新增函数：获取当前连接池中活跃连接的数量
async function getActiveConnectionCount() {
    const connectionsInfo = await pool.getConnectionsInfo();
    const activeConnections = connectionsInfo.filter(conn => conn.state === 'acquired').length;
    return activeConnections;
}

module.exports = {
    getConnection,
    queryOne,
    querySql,
    getActiveConnectionCount
};