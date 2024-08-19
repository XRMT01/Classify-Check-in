// controllers/wxController.js
const axios = require('axios');
require('dotenv').config();

// 获取 access token
async function getAccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.APPID}&secret=${process.env.APPSECRET}`;
    const response = await axios.get(url);
    if (response.data && response.data.access_token) {
        return response.data.access_token;
    } else {
        throw new Error('Failed to get access token');
    }
}

// 通过 js_code 获取 openid 和 session_key
async function getSessionData(code) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.APPID}&secret=${process.env.SECRET}&js_code=${code}&grant_type=authorization_code`;
    //console.log(url);
    const response = await axios.get(url);
    //console.log(response.data);
    if (response.data && response.data.openid) {
        return response.data;
    }else {
        return false;
    }
}

module.exports = {
    getAccessToken,
    getSessionData
};