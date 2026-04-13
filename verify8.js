const fs = require('fs');
let content = fs.readFileSync('temp_modify3.js', 'utf-8');

const tBlock = `
                            {/* Theme Toggle */}
                            <div className="mt-4 border-t border-border pt-4">
                                <Button 
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    variant="outline" 
                                    className="w-full text-left justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <DynamicIcon name={theme === 'dark' ? 'Sun' : 'Moon'} className="w-5 h-5 mr-3" />
                                    <span className="text-lg font-medium">Toggle Theme</span>
                                </Button>
                            </div>`;

content = content.replace(
    /(<Button[^>]*>\s*\{isArabic \? 'كن منشئاً' : 'Become Creator'\}\s*<\/Button>\s*\)\}\s*)(<\/nav>)/,
    `$1${tBlock}\n                            $2`
);
fs.writeFileSync('temp_modify4.js', content);

// check if applied
console.log("Toggle theme applied:", content.includes("Toggle Theme"));
