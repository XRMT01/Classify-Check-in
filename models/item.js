// models/Items.js
module.exports = {
    tableName: 'Items',
    fields: [
        { name: 'ID', type: 'INT', autoIncrement: true, primaryKey: true }, // 商品 ID
        { name: 'Name', type: 'VARCHAR(255)' }, // 商品名称
        { name: 'Description', type: 'TEXT' }, // 商品描述
        { name: 'Price', type: 'INT' } // 商品价格（积分）
    ]
};