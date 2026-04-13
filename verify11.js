const fs = require('fs');
let content = fs.readFileSync('src/app/[locale]/mentors/page.tsx', 'utf-8');

content = content.replace(
    '<div className="max-w-[1225px] mx-auto w-full flex justify-center">',
    '<div className="max-w-[1225px] mx-auto w-full flex justify-center">\n                <div className="flex w-full">'
);
fs.writeFileSync('src/app/[locale]/mentors/page.tsx', content);
