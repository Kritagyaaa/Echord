const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../dist/assets/index-rpF4TZMS.js');
const content = fs.readFileSync(file, 'utf8');

console.log("Length:", content.length);
// Find any http or https
const urls = content.match(/https?:\/\/[^\s"'`]+/g);
console.log("URLs found in JS:", urls);
