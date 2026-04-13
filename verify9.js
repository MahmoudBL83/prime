const fs = require('fs');
let content = fs.readFileSync('temp_modify3.js', 'utf-8');

const tIndex = content.indexOf('كن منش');
if(tIndex !== -1) {
    console.log(content.slice(tIndex - 50, tIndex + 200));
}
