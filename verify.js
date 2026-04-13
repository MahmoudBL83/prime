const fs = require('fs');
let content = fs.readFileSync('temp_modify2.js', 'utf-8');

const t2 = content.includes('Toggle Theme');
const l1 = content.includes('max-w-[1225px]');
const l2 = content.includes('w-[275px]');
const l3 = content.includes('max-w-[600px]');
const l4 = content.includes('w-[350px]');

console.log({ t2, l1, l2, l3, l4 });

