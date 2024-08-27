// routes/checkins.js
const express = require('express');
const router = express.Router();
const checkinsController = require('../controllers/checkinsController');
const authMiddleware = require('../middleware/authMiddleware');


// 扫描二维码路由
router.post('/scan', authMiddleware, checkinsController.scanCode);
// 商品兑换路由
router.post('/redeem', authMiddleware, checkinsController.redeemItem);
// 审核打卡记录路由
router.get('/check/:id', authMiddleware, checkinsController.checkInReview);

// 创建表单
router.post('/create', authMiddleware, checkinsController.createCheckin);

// 新增的路由 - 更新打卡数据
router.post('/update', authMiddleware, checkinsController.updateCheckin);

// 上传图片路由
router.post('/upload', authMiddleware, checkinsController.uploadImages);

// 获取特定用户的打卡记录列表
router.post('/getCheckins', authMiddleware, checkinsController.getUserCheckins);

// 获取图片路由
router.get('/getImage/:ID/:Time/:Name', checkinsController.getImage);

module.exports = router;