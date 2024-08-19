// utils/checkinRules.js
const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '..', 'config', 'checkin_rules.json');

async function getCheckinRules() {
  try {
    const dataBuffer = await fs.promises.readFile(rulesPath, 'utf8');
    const dataJson = JSON.parse(dataBuffer);
    return dataJson.default;
  } catch (error) {
    console.error('Error reading check-in rules:', error);
    throw error;
  }
}

module.exports = { getCheckinRules };