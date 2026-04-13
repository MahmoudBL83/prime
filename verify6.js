const fs = require('fs');
let content = fs.readFileSync('temp_modify3.js', 'utf-8');

const becomeIndex = content.indexOf('Become Creator Button');
if(becomeIndex !== -1) {
    console.log(content.slice(becomeIndex, becomeIndex + 500));
}
