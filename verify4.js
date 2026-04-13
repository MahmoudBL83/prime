const fs = require('fs');
let content = fs.readFileSync('temp_modify3.js', 'utf-8');

const t2 = content.includes('Toggle Theme');
const l3 = content.includes('max-w-[600px]');
console.log({ t2, l3 });

// Also let's check what center block actually looks like.
const centerOld = /<div className="lg:col-span-6 min-h-screen[^>]*>/;
const match = content.match(centerOld);
if (match) {
    console.log("Center still matches old pattern:", match[0]);
    content = content.replace(centerOld, '<div className="flex-grow w-full max-w-[600px] border-l border-r border-border min-h-screen">');
    fs.writeFileSync('temp_modify3.js', content);
}
