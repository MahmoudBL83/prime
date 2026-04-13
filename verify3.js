const fs = require('fs');
let content = fs.readFileSync('temp_modify2.js', 'utf-8');

// The first run failed the replacement on center column since it has an inline style.
const centerOld = /<div className="lg:col-span-6 min-h-[^>]*>/;
content = content.replace(centerOld, '<div className="flex-grow w-full max-w-[600px] border-l border-r border-border min-h-screen">');

// For Become Creator Button:
const becomeOld = /(<Button[^>]*>\s*<DynamicIcon name="PenTool" className="w-5 h-5 mr-3" \/>\s*<span className="text-lg font-medium">Become Creator<\/span>\s*<\/Button>\s*<\/div>|\s*<\/Button>\s*<\/div>.*\s*<\/div>)?\s*({\/\* Theme Toggle \*\/})/m;
// Let's just find the closing bracket of the Become Creator block
const pattern = /({\/\* Become Creator Button - Only show for non-creators \*\/}[\s\S]*?<span className="text-lg font-medium">Become Creator<\/span>\s*<\/Button>\s*<\/div>\s*<div className="mb-2">\s*\}|{\/\* Become Creator Button - Only show for non-creators \*\/}[\s\S]*?Become Creator<\/span>\s*<\/Button>\s*\))/;
if (content.match(pattern)) {
    const themeToggleBlock = `
\\n                            {/* Theme Toggle */}
                            <div className="mb-4">
                                <Button 
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    variant="outline" 
                                    className="w-full text-left justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <DynamicIcon name={theme === 'dark' ? 'Sun' : 'Moon'} className="w-5 h-5 mr-3" />
                                    <span className="text-lg font-medium">Toggle Theme</span>
                                </Button>
                            </div>`;
    content = content.replace(pattern, `$1${themeToggleBlock}`);
}

// Clean up white/10 and inline styles
content = content.replace(/border-white\/10/g, 'border-border');
content = content.replace(/bg-white\/10/g, 'bg-border');
content = content.replace(/style=\{\{ borderLeft: '1px solid rgba\(255,255,255,0\.1\)', borderRight: '1px solid rgba\(255,255,255,0\.1\)' \}\}/, '');

fs.writeFileSync('temp_modify3.js', content);
console.log('Main Feed & Theme Toggle fixed');
