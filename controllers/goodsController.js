// controllers/goodsController.js
const jwt = require('jsonwebtoken'); // 导入 JSON Web Token 库
const { getConnection } = require('../db'); // 导入获取数据库连接的方法
const fs = require('fs'); // 导入 fs 模块用于文件操作
const path = require('path'); // 导入 path 模块来处理文件路径

exports.getGoodsItem = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // Query the database for goods items
        const [goods] = await connection.query(`SELECT * FROM Items`);

        // Process the image paths and build the final response data
        const processedData = [];
        for (let i = 0; i < goods.length; i += 2) {
            const item1 = goods[i];
            const item2 = goods[i + 1];

            // Build the first item with its images
            const item1Data = {
                ...item1,
                ImagePath: item1.ImagePath.split(",").map(name => getImagePath(item1.ID, name)),
            };

            // If there is a second item, build it with its images
            const item2Data = item2 ? {
                ...item2,
                ImagePath: item2.ImagePath.split(",").map(name => getImagePath(item2.ID, name)),
            } : null;

            // Add the pair to the processed data array
            processedData.push([item1Data, item2Data]);
        }
        res.json({
            code: 200,
            msg: '获取商品列表成功',
            data: processedData
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
//获取详细商品
exports.getGoodsDetail = async (req, res) => {
    let connection;
    try {
        const { ID } = req.body;
        connection = await getConnection();

        // Query the database for goods items
        const [goods] = await connection.query(`SELECT * FROM Items WHERE ID = ?`, [ID]);

        // Process the image paths and build the final response data
        const processedData = [];
        for (leti = 0; i < goods.length; i += 2) {
            const item1 = goods[i];
            const item2 = goods[i + 1];

            // Build the first item with its images
            const item1Data = {
                ...item1,
                ImagePath: item1.ImagePath.split(",").map(name => getImagePath(item1.ID, name)),
            };
            processedData.push(item1Data);
            // If there is a second item, build it with itsimages
        }
         // Add the pair to the processed data array
         
         res.json({
            code: 200,
            msg: '获取商品列表成功',
            data: processedData
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


//返回图片
exports.getImage = async (req, res) => {
    let connection;
    try {
        const { ID, Name } = req.params;
        
        // 直接发送文件，不需要查询数据库
        const imagePath = path.join(__dirname, '..', 'uploads', 'Goods', ID, Name);
        
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            return res.status(404).json({ code: 404, msg: '图片不存在' });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};






//获得图片地址
function getImagePath(id,imageName) {
    return `https://check.free.xrmt.cn/api/goods/getImage/${id}/${imageName}`;
}