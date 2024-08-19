// models/Redemptions.js
module.exports = {
    tableName: 'Redemptions',
    fields: [
        { name: 'ID', type: 'INT', autoIncrement: true, primaryKey: true }, // 兑换记录 ID
        { name: 'UserId', type: 'INT', foreignKey: { tableName: 'UserData', key: 'ID' } }, // 用户 ID
        { name: 'ItemId', type: 'INT', foreignKey: { tableName: 'Items', key: 'ID' } } // 商品 ID
    ]
};