const fs = require('fs');
const filePath = 'src/app/[locale]/mentors/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Import useTheme
if (!content.includes("from 'next-themes'")) {
    content = content.replace(
        "import { useSession } from 'next-auth/react'",
        "import { useSession } from 'next-auth/react'\nimport { useTheme } from 'next-themes'"
    );
}

// 2. Insert const { theme, setTheme } = useTheme()
if (!content.includes('const { theme, setTheme } = useTheme()')) {
    content = content.replace(
        /(export default function \w+[^{]+\{)/,
        `$1\n    const { theme, setTheme } = useTheme();`
    );
}

// 8. Replace hardcoded colors globally
content = content.replace(/bg-\[#141414\]/g, 'bg-background');
content = content.replace(/bg-\[#1f1f1f\]/g, 'bg-card');
content = content.replace(/bg-\[#2a2a2a\]/g, 'bg-accent');
content = content.replace(/border-white\/10/g, 'border-border');
content = content.replace(/border-white\/5/g, 'border-border');
content = content.replace(/text-white\/50/g, 'text-muted-foreground');
content = content.replace(/text-white\/70/g, 'text-muted-foreground');
content = content.replace(/text-white\/40/g, 'text-muted-foreground');
content = content.replace(/text-white\/60/g, 'text-muted-foreground');
content = content.replace(/text-white\/80/g, 'text-foreground');
content = content.replace(/text-white\/90/g, 'text-foreground');
content = content.replace(/text-white/g, 'text-foreground');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-accent hover:text-accent-foreground');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-accent hover:text-accent-foreground');
content = content.replace(/hover:bg-white\/20/g, 'hover:bg-accent hover:text-accent-foreground');
content = content.replace(/hover:text-white/g, 'hover:text-foreground');
content = content.replace(/bg-black\/50/g, 'bg-background/50');
content = content.replace(/bg-black\/80/g, 'bg-background/80');

// Save replacements first to inspect
fs.writeFileSync('temp_modify.js', content)
console.log('Colors replaced, check manual parts next');
