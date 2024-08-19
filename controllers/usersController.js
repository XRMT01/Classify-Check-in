// controllers/usersController.js
const jwt = require('jsonwebtoken'); // 导入 JSON Web Token 库
const { getConnection, getActiveConnectionCount } = require('../db'); // 导入获取数据库连接的方法
const { getSessionData } = require('./wxController');
const fs = require('fs'); // 导入 fs 模块用于文件操作
const path = require('path'); // 导入 path 模块来处理文件路径
const multer = require('multer'); // 导入 multer 用于文件上传

// 设置文件存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.user.Uid; // 假设此时已经获取到了用户的 openid
        const userFolder = path.join('uploads', 'User', userId);
        fs.mkdir(userFolder, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating directory:', err);
            }
        });
        cb(null, userFolder);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage }).single('avatar'); // 初始化 multer

// 用户注册
exports.registerUser = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        try {
            const { code, nickName } = req.body;

            // 使用微信小程序的 code 获取 openid 和 session key
            const sessionData = await getSessionData(code);
            if (!sessionData) {
                return res.status(400).json({ code: 400, msg: 'code 无效' });
            }
            const { openid } = sessionData;

            // 检查用户是否存在

            const [rows] = await connection.query('SELECT * FROM UserData WHERE Uid = ?', [openid]);

            // 创建用户文件夹
            const userFolder = path.join('uploads', 'User', openid);
            fs.mkdir(userFolder, { recursive: true }, (err) => {
                if (err) {
                    console.error('Error creating directory:', err);
                }
            });

            // 创建打卡记录文件夹
            const checkinsFolder = path.join(userFolder, 'Checkins');
            fs.mkdir(checkinsFolder, { recursive: true }, (err) => {
                if (err) {
                    console.error('Error creating directory:', err);
                }
            });

            let sessionToken = null;
            let avatarFilename = 'default-avatar.png'; // 默认头像文件名

            if (rows.length === 0) {
                // 如果用户不存在，则创建新用户
                sessionToken = generateSessionToken();
                const regTime = Date.now();
                await connection.query(
                    'INSERT INTO UserData (Uid, AvatarUrl, Name, SessionToken, RegTime) VALUES (?, ?, ?, ?, ?)',
                    [openid, avatarFilename, nickName, sessionToken, regTime]
                );
            } else {
                // 如果用户已存在，则更新昵称
                const userId = rows[0].Uid;
                sessionToken = generateSessionToken(); // 生成新的 session ID
                if (nickName !== rows[0].NickName) {
                    await connection.query('UPDATE UserData SET Name = ? WHERE Uid = ?', [nickName, openid]);
                }
                await connection.query('UPDATE UserData SET SessionToken = ? WHERE Uid = ?', [sessionToken, openid]);
            }

            // 生成 JWT 令牌
            const token = jwt.sign({ Uid: openid, sessionId: sessionToken }, process.env.JWT_SECRET, { expiresIn: '1h' }); // 有效期为 1 小时

            // 返回登录成功消息
            res.json({
                token,
                msg: '用户信息更新成功',
                Integral:0,
            });
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
// 生成会话标识符
function generateSessionToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 检查并修复用户文件夹结构
async function checkAndFixUserFolder(userId) {
    const userFolder = path.join('uploads', 'User', userId);
    try {
        // 获取所有子文件夹
        const subFolders = fs.readdirSync(userFolder, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        // 检查是否有缺少的子文件夹
        const requiredFolders = ['Checkins'];
        for (const folder of requiredFolders) {
            if (!subFolders.includes(folder)) {
                // 创建缺失的子文件夹
                fs.mkdirSync(path.join(userFolder, folder), { recursive: true });
            }
        }
    } catch (error) {
        console.error(`Error checking or fixing user folder ${userId}:`, error);
    }
}
// 用户登录
exports.loginUser = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        try {
            const { code } = req.body;
            console.log(new Date().getTime() + "--" + code);

            const sessionData = await getSessionData(code);
            if (!sessionData) {
                return res.status(400).json({ code: 400, msg: 'code 无效' });
            }
            const openid = sessionData.openid;

            const [rows] = await connection.query('SELECT * FROM UserData WHERE Uid = ?', [openid]);
            if (rows.length === 0) return res.status(400).json({ msg: '用户不存在' });

            const sessionId = generateSessionId();

            await connection.beginTransaction();
            try {
                await connection.query('UPDATE UserData SET SessionToken = ? WHERE Uid = ?', [sessionId, openid]);
                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err;
            }

            const payload = {
                id: rows[0].ID,
                Uid: openid,
                sessionId: sessionId
            };
            const avatarUrl = `https://check.free.xrmt.cn/api/users/getImage/${rows[0].ID}/${rows[0].AvatarUrl}`;
            const NickName = rows[0].Name;

            const token = await new Promise((resolve, reject) => {
                jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    { expiresIn: 3600 },
                    (err, token) => {
                        if (err) return reject(err);
                        resolve(token);
                    }
                );
            });

            res.json({ token, NickName, avatarUrl,Integral:rows[0].Integral });
        } finally {
            connection.release(); // 释放连接回到连接池
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    } finally {
        connection.release(); // 释放连接回到连接池
    }
};


// 用户头像上传
exports.uploadAvatar = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        try {
            const userId = req.user.Uid; // 从请求对象中获取用户ID
            const userFolder = path.join('uploads', 'User', userId);

            // 检查用户是否存在

            const [rows] = await connection.query('SELECT * FROM UserData WHERE Uid = ?', [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ code: 404, msg: '用户不存在' });
            }

            const existingAvatar = rows[0].AvatarUrl;
            const existingAvatarPath = path.join(userFolder, existingAvatar);

            // 如果用户已有头像，则先删除旧头像
            if (existingAvatar && existingAvatar !== 'default-avatar.png') {
                fs.unlink(existingAvatarPath, (err) => {
                    if (err) {
                        console.error('Error deleting old avatar:', err);
                    }
                });
            }

            // 上传头像
            upload(req, res, async function (err) {
                if (err instanceof multer.MulterError) {
                    // A Multer error occurred when uploading.
                    console.error('Multer error:', err);
                    return res.status(400).json({ msg: '上传失败' });
                } else if (err) {
                    // An unknown error occurred when uploading.
                    return res.status(500).send('服务器错误');
                }
                //id
                const id = rows[0].ID

                // 更新数据库中的头像路径
                const newAvatarFilename = req.file.filename;
                await connection.query('UPDATE UserData SET AvatarUrl = ? WHERE Uid = ?', [newAvatarFilename, userId]);

                // 构建头像的完整 URL
                const avatarUrl = newAvatarFilename;

                res.json({ id, msg: '头像上传成功', avatarUrl });
            });
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

//返回图片
exports.getImage = async (req, res) => {
    let connection = await getConnection();
    const { ID, Name } = req.params;
    // 检查用户是否存在

    const [rows] = await connection.query('SELECT * FROM UserData WHERE ID = ?', [ID]);

    if (rows.length === 0) {
        return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    res.sendFile(path.join(__dirname, '..', 'uploads', 'User', rows[0].Uid, Name));
};


// 生成 session ID 的函数
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}