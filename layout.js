const fs = require('fs');
let content = fs.readFileSync('temp_modify.js', 'utf-8');

// Container & Grid -> flex wrapper
content = content.replace(
    /<div className="container mx-auto">\s*<div className="grid grid-cols-1 lg:grid-cols-12 gap-0">/g,
    '<div className="max-w-[1225px] mx-auto w-full flex justify-center">'
);
// We also need to remove the closing div for the grid. 
// Or just replace the two divs with a fragment and one div?
// Actually, let's just replace both classes.
// wait, `container mx-auto` and `grid grid-cols-1 llg:grid-cols-12 gap-0` are two divs. 
// Let's replace:
// <div className="container mx-auto">
//     <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
// with 
// <div className="max-w-[1225px] mx-auto w-full flex justify-center">
// ... wait, that leaves a missing closing </div>. We should replace the inner grid div's class with `flex justify-center flex-row w-full` and replace the container with `max-w-[1225px] mx-auto w-full flex justify-center` ... 
// Better: keep 2 divs. 
// <div className="max-w-[1225px] mx-auto w-full">
//     <div className="flex w-full justify-center">
// Then closing </div></div> matches perfectly.
content = content.replace(
    /<div className="container mx-auto">\s*<div className="grid grid-cols-1 lg:grid-cols-12 gap-0">/g,
    '<div className="max-w-[1225px] mx-auto w-full">\n<div className="flex w-full justify-center">'
);

// Left Sidebar Wrapper
const leftSidebarRegex = /<div className=\{`fixed lg:static inset-y-0 left-0 z-50 w-\[280px\] sm:w-72 lg:w-auto lg:col-span-3 p-3 sm:p-4 bg-card lg:bg-transparent transform transition-transform duration-300 lg:transform-none \$\{isMobileMenuOpen \? 'translate-x-0' : '-translate-x-full lg:translate-x-0'\s*\}`\}>/g;
const newLeftWrapper = `<div className={\`fixed z-50 p-3 sm:p-4 bg-card lg:bg-transparent transform transition-transform duration-300 \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static w-[275px] lg:sticky lg:top-0 h-[100dvh] overflow-y-auto\`}>`;
content = content.replace(leftSidebarRegex, newLeftWrapper);


// Now we have a <div className="lg:sticky lg:top-24"> inside Left Sidebar... wait, we made the wrapper overflow-y-auto and h-[100dvh], so we can just leave inner one alone.

// Center Feed Wrapper
// Look for something like lg:col-span-6 or Main Feed
// Let's find it.
const centerRegex = /<div className="lg:col-span-6 border-x border-border min-h-screen">/g;
if(content.match(centerRegex)) {
    content = content.replace(centerRegex, '<div className="flex-grow w-full max-w-[600px] border-l border-r border-border min-h-screen">');
} else {
    // If different classes:
    const altCenterRegex = /<div className="lg:col-span-6[^"]*">/g;
    content = content.replace(altCenterRegex, '<div className="flex-grow w-full max-w-[600px] border-l border-r border-border min-h-screen">');
}

// Right Sidebar Wrapper
// Look for lg:col-span-3 hidden lg:block ...
const rightRegex = /<div className="hidden lg:block lg:col-span-3 p-4">/g;
if(content.match(rightRegex)) {
     content = content.replace(rightRegex, '<div className="hidden xl:block w-[350px] flex-shrink-0 p-4 sticky top-0 h-[100dvh] overflow-y-auto">');
} else {
     const altRightRegex = /<div className="hidden lg:block lg:col-span-3[^"]*">/g;
     content = content.replace(altRightRegex, '<div className="hidden xl:block w-[350px] flex-shrink-0 p-4 sticky top-0 h-[100dvh] overflow-y-auto">');
}

// Add Theme Toggle to left sidebar near "Become Creator"
const becomeCreatorRegex = /(<Button[^>]+variant="outline"[^>]+className="w-full text-left justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground"[^>]*>[\s\S]*?<DynamicIcon name="PenTool" className="w-5 h-5 mr-3" \/>\s*<span className="text-lg font-medium">Become Creator<\/span>\s*<\/Button>\s*<\/div>)/;
if(content.match(becomeCreatorRegex)) {
    const themeToggleBlock = `
                            {/* Theme Toggle */}
                            <div className="mb-2">
                                <Button 
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    variant="outline" 
                                    className="w-full text-left justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <DynamicIcon name={theme === 'dark' ? 'Sun' : 'Moon'} className="w-5 h-5 mr-3" />
                                    <span className="text-lg font-medium">Toggle Theme</span>
                                </Button>
                            </div>
`;
    content = content.replace(becomeCreatorRegex, `$1\n${themeToggleBlock}`);
} else {
    // alternative matching for Become creator
    const altRegex = /(<div className="mb-2">\s*<Button[^>]*>\s*<DynamicIcon name="PenTool"[^>]*\/>\s*<span[^>]*>Become Creator<\/span>\s*<\/Button>\s*<\/div>)/i;
    content = content.replace(altRegex, `$1\n                            {/* Theme Toggle */}\n                            <div className="mb-2">\n                                <Button \n                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}\n                                    variant="outline" \n                                    className="w-full text-left justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground"\n                                >\n                                    <DynamicIcon name={theme === 'dark' ? 'Sun' : 'Moon'} className="w-5 h-5 mr-3" />\n                                    <span className="text-lg font-medium">Toggle Theme</span>\n                                </Button>\n                            </div>`);
}

fs.writeFileSync('temp_modify2.js', content)
console.log('Layout replaced');
