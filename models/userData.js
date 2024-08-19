// models/UserData.js
module.exports = {
    tableName: 'UserData',
    fields: [
        { name: 'ID', type: 'INT', autoIncrement: true, primaryKey: true }, // 用户 ID
        { name: 'Uid', type: 'VARCHAR(255)', unique: true }, // 用户唯一标识
        { name: 'State', type: 'TINYINT', defaultValue: 1 }, // 用户状态
        { name: 'AvatarUrl', type: 'VARCHAR(255)' }, // 用户头像 URL
        { name: 'Name', type: 'VARCHAR(255)' }, // 用户姓名
        { name: 'Integral', type: 'INT', defaultValue: 0 }, // 积分数
        { name: 'Register', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' } // 注册时间
    ]
};