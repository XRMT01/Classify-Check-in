// routes/goods.js
const express = require('express');
const router = express.Router();
const goodsController = require('../controllers/goodsController');
const authMiddleware = require('../middleware/authMiddleware');

// 扫描二维码路由
router.get('/item', goodsController.getGoodsItem);

// 获取图片路由
router.get('/getImage/:ID/:Name', goodsController.getImage);

// 获取商品
router.post('/getGoodsDetail', goodsController.getGoodsDetail);

module.exports = router;