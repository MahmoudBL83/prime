# 🎨 Theme System - Easy Color Customization Guide

## Quick Start

All colors in the application can be changed by editing **ONE FILE**:
📁 `src/app/globals.css`

Look for the `:root` (light mode) and `.dark` (dark mode) sections.

## Color System Overview

### How It Works
1. All components now use CSS variables instead of hardcoded colors
2. Change a color once in `globals.css` and it updates everywhere
3. Supports both light and dark modes automatically
4. 5703 color instances updated across 162 files!

## Available Color Variables

### Background Colors
```css
--background      /* Main page background */
--card            /* Card/panel backgrounds */
--card-hover      /* Card hover state */
--muted           /* Subtle backgrounds */
--muted-dark      /* Darker subtle backgrounds */
```

### Text Colors
```css
--foreground         /* Main text color */
--muted-foreground   /* Secondary/dim text */
--card-foreground    /* Text on cards */
```

### Brand Colors
```css
--primary            /* Main brand color (purple) */
--primary-hover      /* Primary hover state */
--secondary          /* Secondary brand color (pink) */
--secondary-hover    /* Secondary hover state */
```

### Border Colors
```css
--border         /* Default borders */
--border-hover   /* Border hover state */
```

### Utility Colors
```css
--success   /* Success messages (green) */
--info      /* Info messages (blue) */
--warning   /* Warning messages (orange) */
--error     /* Error messages (red) */
```

### Input Colors
```css
--input-bg       /* Input backgrounds */
--input-border   /* Input borders */
--input-focus    /* Input focus state */
```

## Example: Changing Brand Colors

Want to change from purple to blue?

### Light Mode
```css
:root {
  --primary: #3b82f6;        /* Blue instead of purple */
  --primary-hover: #2563eb;  /* Darker blue on hover */
}
```

### Dark Mode
```css
.dark {
  --primary: #60a5fa;        /* Lighter blue for dark mode */
  --primary-hover: #93c5fd;  /* Even lighter on hover */
}
```

## Example: Custom Color Scheme

Want a green theme?

```css
:root {
  --primary: #10b981;
  --primary-hover: #059669;
  --secondary: #14b8a6;
  --secondary-hover: #0d9488;
}

.dark {
  --primary: #34d399;
  --primary-hover: #6ee7b7;
  --secondary: #2dd4bf;
  --secondary-hover: #5eead4;
}
```

## Tailwind Classes Used

The components now use these semantic classes:

### Backgrounds
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `bg-card-hover` - Hover states
- `bg-muted` - Subtle backgrounds
- `bg-primary` - Primary color
- `bg-secondary` - Secondary color

### Text
- `text-foreground` - Main text
- `text-muted-foreground` - Dim text
- `text-primary` - Primary color text
- `text-secondary` - Secondary color text

### Borders
- `border-border` - Default borders
- `border-primary` - Primary color borders
- `border-secondary` - Secondary color borders

### Hover States
- `hover:bg-card-hover` - Card hover
- `hover:bg-primary-hover` - Primary hover
- `hover:text-foreground` - Text hover

## Testing Your Changes

1. Edit `src/app/globals.css`
2. Save the file
3. Clear cache: `Remove-Item .next -Recurse -Force`
4. Refresh your browser
5. Toggle between light/dark mode using the Sun/Moon button

## Tips

### Contrast is Key
- Ensure good contrast between `--background` and `--foreground`
- Test both light and dark modes
- Use tools like https://contrast-ratio.com/

### Stay Consistent
- Keep related colors harmonious
- Use darker shades for hover states
- Maintain the same color relationships in both modes

### Brand Colors
- Primary is used for: buttons, links, highlights
- Secondary is used for: accents, badges, special features
- Keep these distinct but complementary

## Need Help?

The color values are in standard hex format: `#RRGGBB`
- Examples: `#ff0000` (red), `#00ff00` (green), `#0000ff` (blue)
- Use online color pickers to find your perfect shades
- Test in both light and dark modes!

---

🎨 **That's it!** One file controls all colors across the entire application.
