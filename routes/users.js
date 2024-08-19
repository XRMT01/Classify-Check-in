// routes/users.js
const express = require('express'); // 导入 Express 模块
const router = express.Router(); // 创建路由实例
const usersController = require('../controllers/usersController'); // 导入用户控制器
const authMiddleware = require('../middleware/authMiddleware'); // 导入身份验证中间件

// 注册用户路由
router.post('/register', usersController.registerUser);
// 登录用户路由
router.post('/login', usersController.loginUser);

// 上传头像路由
router.post('/uploadAvatar', authMiddleware, usersController.uploadAvatar);

// 获取图片路由
router.get('/getImage/:ID/:Name', usersController.getImage);

module.exports = router; // 导出路由