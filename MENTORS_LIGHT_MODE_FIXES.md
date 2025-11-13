# Mentors Page Light Mode Fixes

## Changes Made

### Text Colors Fixed:
- `text-white` → `text-foreground` (main text)
- `text-gray-300` → `text-muted-foreground` (secondary text)
- `text-gray-400` → `text-muted-foreground` (secondary text)
- `text-gray-500` → `text-muted-foreground` (secondary text)
- `text-gray-600` → `text-muted-foreground` (icon colors)

### Background Colors Fixed:
- `bg-white/[0.02]` → `bg-card-hover` (hover states)
- `hover:bg-white/[0.02]` → `hover:bg-card-hover` (hover states)
- `bg-white/5` → `bg-card` (input backgrounds)

### Border Colors Fixed:
- `border-white/10` → `border-border` (all borders)
- `border-white/20` → `border-border` (all borders)
- `divide-white/10` → `divide-border` (dividers)
- `border-2 border-black` → `border-2 border-background` (online indicators)

### Specific Sections Updated:

1. **Empty States**:
   - No subscriptions message
   - No bookmarks message
   - Icons and text now use theme-aware colors

2. **Creator Cards** (Grid View):
   - Card backgrounds: `bg-white/[0.02]` → `bg-card`
   - Card borders: `border-white/10` → `border-border`
   - Creator names: `text-white` → `text-foreground`
   - Expertise text: `text-gray-400` → `text-muted-foreground`
   - Stats text: `text-gray-400` → `text-muted-foreground`

3. **Sidebar - Suggested Creators**:
   - Card background: `bg-white/[0.02]` → `bg-card`
   - Card border: `border-white/10` → `border-border`
   - Section title: `text-white` → `text-foreground`
   - Creator names: `text-white` → `text-foreground`
   - Stats: `text-gray-400` → `text-muted-foreground`
   - Price label: `text-gray-500` → `text-muted-foreground`

4. **Search Input**:
   - Background: `bg-white/5` → `bg-card`
   - Border: `border-white/10` → `border-border`
   - Text: `text-white` → `text-foreground`
   - Icon: `text-gray-500` → `text-muted-foreground`

5. **Post Content**:
   - Post text: `text-white` → `text-foreground`
   - Quoted post border: `border-white/10` → `border-border`
   - Quoted post background: `hover:bg-white/[0.02]` → `hover:bg-card-hover`
   - Quoted post text: `text-gray-300` → `text-muted-foreground`
   - Username in quotes: `text-gray-500` → `text-muted-foreground`
   - Engagement stats: `text-gray-500` → `text-muted-foreground`

## Colors That Stay the Same:
- Gradient backgrounds (purple/pink) - intentionally colored
- Badge text on colored backgrounds (stays white for contrast)
- Star ratings (yellow)
- Online indicators (green)
- Brand accent colors

## Result:
✅ Light mode now properly readable
✅ Dark mode still works perfectly
✅ All text visible with proper contrast
✅ Theme switching works seamlessly
