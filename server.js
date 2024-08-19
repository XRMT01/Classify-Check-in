// server.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { getConnection, queryOne, querySql } = require('./db'); // 导入数据库操作


// 初始化 Express 应用和中间件
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 设置 Multer 用于文件上传
const storage = multer.diskStorage({
    // ...
});

const upload = multer({ storage: storage });

// 导入路由模块
const usersRoute = require('./routes/users');
const checkinsRoute = require('./routes/checkins');

// 使用路由
app.use('/api/users', usersRoute);
app.use('/api/checkins', checkinsRoute);

// 启动服务器
const PORT = process.env.PORT || 30006;
app.listen(PORT, async () => {
    console.log(`服务器运行在端口 ${PORT}`);

    try {
        const connection = await getConnection();
        await connection.query('SELECT 1 + 1 AS solution');
        console.log('数据库连接成功！');
        connection.release(); // 释放连接回到连接池
    } catch (err) {
        console.error('数据库连接失败:', err);
    }
});