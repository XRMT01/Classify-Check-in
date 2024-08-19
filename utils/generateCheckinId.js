// utils/generateCheckinId.js
module.exports = {
    generateCheckinId: (uid, date) => {
        // 使用用户的 UID、当前日期时间戳以及一些随机数生成一个 CheckinID
        const timestamp = date.getTime();
        const randomPart = Math.floor(Math.random() * 10000); // 生成一个四位的随机数
        return `C${uid}-${timestamp}-${randomPart}`;
    }
};