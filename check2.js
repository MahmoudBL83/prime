const fs = require('fs');
let content = fs.readFileSync('temp_modify.js', 'utf-8');

const sStartIndex = content.indexOf('<div className="container mx-auto">');
const gridIndex = content.indexOf('<div className="grid grid-cols-1 lg:grid-cols-12 gap-0">', sStartIndex);
const sEndIndex = content.indexOf('</div>', gridIndex);

console.log("Indices:", {sStartIndex, gridIndex, sEndIndex});
if (sStartIndex !== -1) {
    const section = content.slice(sStartIndex, sStartIndex + 1000);
    console.log(section);
}
