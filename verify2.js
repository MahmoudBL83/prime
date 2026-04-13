const fs = require('fs');
let content = fs.readFileSync('temp_modify.js', 'utf-8');

const becomeIndex = content.indexOf('Become Creator');
if(becomeIndex !== -1) {
    console.log("Become Creator block:\n", content.slice(becomeIndex - 200, becomeIndex + 200));
}

const mainFeedIndex = content.indexOf('Main Feed');
if(mainFeedIndex !== -1) {
    console.log("Main Feed wrapper block:\n", content.slice(mainFeedIndex - 200, mainFeedIndex + 100));
}

