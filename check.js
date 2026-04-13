const fs = require('fs');
let content = fs.readFileSync('temp_modify.js', 'utf-8');

// Find layout
const match = content.match(/return \(\s*<div className="min-h-screen/);
if (match) {
    console.log("Found return block at index", match.index);
    const sliced = content.slice(match.index, match.index + 2000);
    console.log(sliced);
} else {
    console.log("Not found min-h-[100dvh] or min-h-screen block");
    // Fallback: search for container styles
    const m2 = content.match(/className="container mx-auto/);
    if (m2) {
         console.log("Found container at index", m2.index);
         console.log(content.slice(m2.index - 50, m2.index + 2000));
    }
}
