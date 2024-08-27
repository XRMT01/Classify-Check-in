// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const { getConnection } = require('../db'); // 导入获取数据库连接的方法
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msg: '未授权访问' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ msg: '令牌无效' });
    }
    console.log(decoded);
    // 检查 session ID 是否是最新的
    const connection = await getConnection();
    const [userRows] = await connection.query('SELECT * FROM UserData WHERE Uid = ?', [decoded.Uid]);
    if (userRows.length === 0 || userRows[0].SessionToken !== decoded.sessionId) {
      return res.status(403).json({ msg: '会话已过期' });
    }

    switch(userRows[0].State)
    {
      case 0 && userRows[0].AavatarUrl != "default-avatar.png":
        return res.status(403).json({ msg: '账号未激活', state: 0 });
      case -1:
        return res.status(403).json({ msg: '账号已经被封禁', state: -1 });
      case -2:
        return res.status(403).json({ msg: '账号已被冻结', state: -2 });
      case -3:
        return res.status(403).json({ msg: '账号已被注销', state: -3 });
      case -4:
        return res.status(403).json({ msg: '账号异常', state: -4 });
    }

    req.user = decoded; // 附加解码后的用户信息到请求对象
    next();
  });
};