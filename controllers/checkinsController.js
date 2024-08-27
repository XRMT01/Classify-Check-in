// controllers/checkinsController.js
const jwt = require('jsonwebtoken'); // 导入 JSON Web Token 库
const { getConnection } = require('../db'); // 导入获取数据库连接的方法
const fs = require('fs'); // 导入 fs 模块用于文件操作
const path = require('path'); // 导入 path 模块来处理文件路径
const multer = require('multer'); // 导入 multer 用于文件上传
const { generateCheckinId } = require('../utils/generateCheckinId'); // 导入生成 CheckinID 的函数
const { getCheckinRules } = require('../utils/checkinRules');

// 设置文件存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const Uid = req.user.Uid;
        const currentDate = new Date().toISOString().split('T')[0];
        const checkinFolder = path.join('uploads', 'User', Uid, 'Checkins', currentDate);
        fs.mkdir(checkinFolder, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating directory:', err);
            }
        });
        cb(null, checkinFolder);
    },
    filename: function (req, file, cb) {
        const userId = req.user.id;
        cb(null, `checkin-${userId}-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage }).array('images', 3);

// 创建一条打卡记录
exports.createCheckin = async (req, res) => {
    let connection = await getConnection();

    try {
        const { Uid, sessionId } = req.user; // 从请求体中获取用户 ID
        const today = new Date().toISOString().split('T')[0];

        // 检查是否超过了每日最大打卡次数
        const checkinRules = await getCheckinRules();
        const [todayCheckins] = await connection.query(
            'SELECT COUNT(*) AS count FROM Checkins WHERE UserId = ? AND DATE(CheckinTime) = DATE(?)',
            [Uid, today]
        );

        if (todayCheckins[0].count >= checkinRules.maxDailyEntries) {
            return res.status(403).json({ msg: '今日打卡次数已满' });
        }

        // 插入打卡记录并获取该记录的 CheckinID (自增长的ID)
        const [result] = await connection.query('INSERT INTO Checkins (UserId, Type, Status, CheckinTime) VALUES (?, "none", "pending", ?)', [Uid, today]);

        // 获取插入的记录的 CheckinID (自增长的ID)
        const insertedCheckinId = result.insertId;

        // 生成新的 token，包含 CheckinID 和 Uid
        const token = jwt.sign({ checkinId: insertedCheckinId, Uid: Uid, sessionId: sessionId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ msg: '打卡记录创建成功', checkinId: insertedCheckinId, token }); // 返回成功消息和 CheckinID
    } finally {
        connection.release(); // 释放连接回到连接池
    }
};


// 上传图片
exports.uploadImages = async (req, res) => {
    let connection = await getConnection();
    console.log(req.user);
    try {
        try {
            const { Uid, checkinId } = req.user; // 从请求体中获取用户 ID
            upload(req, res, async function (err) {
                if (err instanceof multer.MulterError) {
                    // A Multer error occurred when uploading.
                    console.error(err);
                    return res.status(400).json({ msg: '上传失败' });
                } else if (err) {
                    // An unknown error occurred when uploading.
                    return res.status(500).send('服务器错误');
                }

                // 如果一切正常，文件已经被保存在 'uploads/avatars/<userid>/checkin-<checkinId>' 目录下
                const imagePaths = req.files.map(file => file.filename);

                // 将所有图片路径组合成一个字符串，以逗号分隔
                const combinedImagePaths = imagePaths.join(',');

                // 查询现有的图片路径
                const [existingPathsResult] = await connection.query(
                    'SELECT ImagePath FROM Checkins WHERE ID = ? AND UserId = ?',
                    [checkinId, Uid]
                );

                let existingImagePaths = existingPathsResult[0].ImagePath;

                // 如果现有的图片路径为空，则直接使用新上传的图片路径
                if (!existingImagePaths) {
                    existingImagePaths = combinedImagePaths;
                } else {
                    // 如果现有的图片路径不为空，则拼接新的图片路径
                    existingImagePaths += `,${combinedImagePaths}`;
                }

                // 更新打卡记录的图片路径
                const [result] = await connection.query(
                    'UPDATE Checkins SET ImagePath = ? WHERE ID = ? AND UserId = ?',
                    [existingImagePaths, checkinId, Uid]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ msg: '未找到匹配的打卡记录' });
                }

                res.json({ msg: '图片上传成功' }); // 返回成功消息
            });
        } finally {
            connection.release(); // 释放连接回到连接池
        }
    } catch (err) {
        console.error(err.message); // 输出错误信息
        res.status(500).send('服务器错误'); // 返回服务器错误响应
    } finally {
        connection.release(); // 释放连接回到连接池
    }
};


// 更新打卡数据
exports.updateCheckin = async (req, res) => {
    let connection;
    try {
        try {
            connection = await getConnection();
            const { type } = req.body;
            const { Uid, checkinId } = req.user; // 从请求体中获取用户 ID

            // 更新打卡记录的类型
            const [result] = await connection.query(
                'UPDATE Checkins SET Type = ? WHERE ID = ? AND UserId = ?',
                [type, checkinId, Uid]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ msg: '未找到匹配的打卡记录' });
            }

            res.json({ msg: '打卡记录更新成功' });
        } finally {
            connection.release(); // 释放连接回到连接池
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    } finally {
        if (connection) {
            connection.release(); // 释放连接回到连接池
        }
    }
};




// 获取特定用户的打卡记录列表
exports.getUserCheckins = async (req, res) => {
    let connection;
    try {
        try {
            connection = await getConnection();

            const { Uid } = req.user;

            // 查询数据库
            const [user] = await connection.query(`SELECT * FROM Checkins WHERE UserId = ?`, [Uid]);

            let result = [];
            for (let index = 0; index < user.length; index++) {
                let dateTime = user[index].CheckinTime;
                console.log(dateTime);

                const dateObj = convertDateTimeToDateObject(dateTime);
                const imagePaths = user[index].ImagePath.split(",");
                // 查找当天的数据项
                const existingItem = result.find(item => item.time.month === dateObj.month && item.time.day === dateObj.day);
                let Integral_Status = getInIntegral(connection, user[index].Status);
                if (existingItem) {
                    // 如果找到了，就添加到现有的数据项中
                    existingItem.data.push({
                        title: state(user[index].Status),
                        status: user[index].Status,
                        text: Integral_Status.text, // 根据实际情况填写
                        score: Integral_Status.Integral,
                        type: GarbageType(user[index].Type), // 这里使用Type作为垃圾类型
                        images: getCheckinImageUploadUrl(index + 1, addDaysToDate(dateTime, 1), imagePaths[0]) // 根据实际情况填写
                    });
                } else {
                    // 如果没有找到，则创建一个新的数据项
                    result.push({
                        time: dateObj,
                        data: [{
                            title: state(user[index].Status),
                            status: user[index].Status,
                            text: Integral_Status.text, // 根据实际情况填写
                            score: Integral_Status.Integral,
                            type: GarbageType(user[index].Type), // 这里使用Type作为垃圾类型
                            images: getCheckinImageUploadUrl(index + 1, addDaysToDate(dateTime, 1), imagePaths[0]) // 根据实际情况填写
                        }]
                    });
                }
            }

            res.json({
                data: result
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "后端出现问题"
        });
    } finally {
        connection.release();
    }
};


//返回图片
exports.getImage = async (req, res) => {
    let connection = await getConnection();
    try {
        const { ID, Time, Name } = req.params;
        // 检查用户是否存在

        const [rows] = await connection.query('SELECT * FROM Checkins WHERE ID = ?', [ID]);

        if (rows.length === 0) {
            return res.status(404).json({ code: 404, msg: '图片不存在' });
        }
        res.sendFile(path.join(__dirname, '..', 'uploads', 'User', rows[0].UserId, 'Checkins', Time, Name));
    } finally {
        connection.release();
    }
};


// 扫描二维码
exports.scanCode = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { Uid } = req.user; // 从请求体中获取用户 ID
        const { Integral } = req.body; // 从请求体中获取积分

        // 检查是否超过了每日最大扫描次数
        const checkinRules = await getCheckinRules();
        const today = new Date().toISOString().split('T')[0];
        const [todayCheckins] = await connection.query(
            'SELECT COUNT(*) AS count FROM CheckinsQt WHERE UserId = ? AND DATE(RegTime) = DATE(?)',
            [Uid, today]
        );

        if (todayCheckins[0].count >= checkinRules.maxDailyScans) {
            return res.status(403).json({ msg: '今日扫描次数已满' });
        }

        // 插入扫描打卡记录
        const [result] = await connection.query(
            'INSERT INTO CheckinsQt (UserId, Integral, RegTime) VALUES (?, ?, ?)',
            [Uid, checkinRules.rewardPointsPerCheckin, new Date()]
        );

        // 获取插入的记录的 ID
        const insertedCheckinId = result.insertId;

        // 更新 UserData 表中的积分
        const [updateResult] = await connection.query(
            'UPDATE UserData SET Integral = Integral + ? WHERE Uid = ?',
            [checkinRules.rewardPointsPerCheckin, Uid]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ msg: '更新积分失败' });
        }
        const [rows] = await connection.query('SELECT * FROM UserData WHERE Uid = ?', [Uid]);

        res.json({ msg: '扫描打卡记录创建成功', checkinId: insertedCheckinId, Integral: rows[0].Integral });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    } finally {
        if (connection) {
            connection.release(); // 释放连接回到连接池
        }
    }
};
// 商品兑换
exports.redeemItem = async (req, res) => {
    const { itemId, userId } = req.body;

    let connection = await getConnection();
    try {
        // 扣除用户积分
        const [userRows] = await connection.query('SELECT * FROM UserData WHERE ID = ?', [userId]);
        const user = userRows[0];

        if (user.Integral < 100) {
            return res.status(400).json({ msg: '积分不足' });
        }

        await connection.query('UPDATE UserData SET Integral = Integral - 100 WHERE ID = ?', [userId]);

        // 创建兑换记录
        await connection.query('INSERT INTO Redemptions (UserId, ItemId) VALUES (?, ?)', [userId, itemId]);

        res.json({ msg: '兑换成功' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    } finally {
        connection.release();
    }
};

// 审核打卡记录
exports.checkInReview = async (req, res) => {
    const { id } = req.params;

    let connection = await getConnection();
    try {
        // 获取打卡记录
        const [checkinRows] = await connection.query('SELECT * FROM Checkins WHERE ID = ?', [id]);

        if (checkinRows.length === 0) {
            return res.status(404).json({ msg: '找不到打卡记录' });
        }

        res.json(checkinRows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    } finally {
        connection.release();
    }
};











// 假设 GarbageType 和 state 函数已经定义好
function GarbageType(type) {
    // 返回垃圾类型的描述
    switch (type) {
        case 'chuyu':
            return '厨余垃圾';
        case 'qita':
            return '其他垃圾';
        case 'none':
            return '无';
        default:
            return '未知类型';
    }
}

function state(status) {
    // 返回状态的描述
    switch (status) {
        case 'approved':
            return '已批准';
        case 'rejected':
            return '已拒绝';
        case 'pending':
            return '待审核';
        default:
            return '未知状态';
    }
}
// 定义一个辅助函数来将 datetime 字符串转换为包含月份和日期的对象
function convertDateTimeToDateObject(datetime) {
    // 转换 datetime 字符串为日期对象
    const date = new Date(datetime);
    return {
        month: date.getMonth() + 1, // 月份是从0开始的，所以需要+1
        day: date.getDate() // 当前日期
    };
}

// 获取得分

function getInIntegral(connection, Status) {
    switch (Status) {
        case "pending":
            return {
                Integral: 0,
                text: "无"
            };
        default:
            return {
                Integral: 0,
                text: "无"
            };
    }
}

// 获取打卡图片上传地址
function getCheckinImageUploadUrl(ID, Time, Name) {
    return `https://check.free.xrmt.cn/api/checkins/getImage/${ID}/${Time}/${Name}`;
}

//增加日期
function addDaysToDate(dateTimeString, daysToAdd) {
    const date = new Date(dateTimeString);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
}