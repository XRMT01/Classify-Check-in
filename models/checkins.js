// models/Checkins.js
module.exports = {
    tableName: 'Checkins',
    fields: [
        { name: 'ID', type: 'INT', autoIncrement: true, primaryKey: true }, // 打卡记录 ID
        { name: 'UserId', type: 'INT', foreignKey: { tableName: 'UserData', key: 'ID' } }, // 用户 ID
        { name: 'ImagePath', type: 'VARCHAR(255)' }, // 图片路径
        { name: 'Code', type: 'VARCHAR(255)' }, // 二维码内容
        { name: 'Status', type: 'ENUM("pending", "scanned", "approved", "rejected")', defaultValue: 'pending' } // 打卡状态
    ]
};