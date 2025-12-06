# Early Access Control Feature

## Overview
This feature allows administrators to control the visibility of the early access modal through the admin panel. When enabled, visitors to the website will see a full-screen modal prompting them to join the waitlist. When disabled, the platform is fully accessible.

## Features Implemented

### 1. Database Schema
- Added `PlatformSettings` model to the database schema
- Fields:
  - `earlyAccessEnabled` (Boolean): Controls early access modal visibility
  - `maintenanceMode` (Boolean): Controls maintenance mode (for future use)

### 2. API Endpoints

#### Admin Endpoint (Protected)
**GET/PATCH** `/api/admin/settings/platform`
- Requires admin authentication
- GET: Retrieves current platform settings
- PATCH: Updates platform settings
- Request body for PATCH:
```json
{
  "earlyAccessEnabled": true/false,
  "maintenanceMode": true/false
}
```

#### Public Endpoint
**GET** `/api/platform-settings`
- No authentication required
- Returns current platform settings for public consumption
- Used by the frontend to check if early access is enabled

### 3. Admin Panel Integration
Location: `/admin/settings` → General tab

The admin settings page now includes:
- **Platform Access Control** section at the top
- Visual status indicators showing current state
- Toggle switches for:
  - **Early Access Mode**: Show/hide the early access modal
  - **Maintenance Mode**: Enable/disable maintenance mode

### 4. Frontend Implementation
The layout (`src/app/[locale]/layout.tsx`) now:
- Checks platform settings on page load
- Conditionally renders the `EarlyAccessModal` based on the `earlyAccessEnabled` setting
- Defaults to showing the modal if settings cannot be fetched

## How to Use

### Admin Access (Bypasses Early Access)

Admins can always access the platform regardless of early access settings:

1. **Direct Admin Login**: Navigate to `/admin/login`
2. **From Early Access Modal**: Click the "Admin Access" link at the bottom
3. **Login Credentials**:
   - Email: `admin@prime.eg`
   - Password: `demo123`
   - Role: ADMIN

The admin login page:
- Has its own dedicated route: `/admin/login`
- Completely bypasses the early access modal
- Uses a secure, separate layout
- Redirects to `/admin` dashboard after successful login
- Validates admin role before granting access

### For Administrators

#### To Enable Early Access (Close Platform)
1. Navigate to `/admin/settings`
2. Go to the "General" tab
3. Toggle "Early Access Mode" to ON (blue)
4. The platform will now show the early access modal to all visitors

#### To Disable Early Access (Open Platform)
1. Navigate to `/admin/settings`
2. Go to the "General" tab
3. Toggle "Early Access Mode" to OFF (gray)
4. The platform is now fully accessible without the modal

### Status Indicators
The admin panel shows real-time status:
- **Early Access Mode**:
  - Active (Blue badge): Modal is shown to visitors
  - Disabled (Green badge): Platform is open
- **Maintenance Mode**:
  - Active (Red badge): Platform is in maintenance
  - Normal (Green badge): Platform is operating normally

## Technical Details

### Files Modified/Created

1. **Database Schema**
   - `prisma/schema.prisma`: Added `PlatformSettings` model

2. **API Routes**
   - `src/app/api/admin/settings/platform/route.ts`: Admin-protected endpoint
   - `src/app/api/platform-settings/route.ts`: Public endpoint

3. **Admin Access**
   - `src/app/admin/login/page.tsx`: Dedicated admin login page
   - `src/app/admin/login/layout.tsx`: Admin login layout (bypasses early access)
   - `src/middleware.ts`: Updated to handle admin routes separately

4. **Frontend Components**
   - `src/app/[locale]/layout.tsx`: Conditional rendering of early access modal
   - `src/app/admin/settings/page.tsx`: Admin UI with toggles
   - `src/components/EarlyAccessModal.tsx`: Added admin access link
   - `src/components/AdminAccessButton.tsx`: Floating admin access button

5. **Seed Files**
   - `prisma/seed-platform-settings.ts`: Initialize default settings

### Security
- Admin endpoints are protected by NextAuth session verification
- Only users with `role: 'ADMIN'` can modify settings
- Public endpoint only returns non-sensitive information

### Default Values
- `earlyAccessEnabled`: `true` (modal shown by default)
- `maintenanceMode`: `false` (platform operational by default)

## Database Commands

### Initialize Settings
```bash
npx tsx prisma/seed-platform-settings.ts
```

### Apply Schema Changes
```bash
npx prisma db push
```

### Generate Prisma Client
```bash
npx prisma generate
```

## Future Enhancements

1. **Maintenance Mode Implementation**: Complete the maintenance mode functionality to show a maintenance page
2. **Scheduled Changes**: Allow admins to schedule when to open/close early access
3. **Email Notifications**: Automatically notify waitlist subscribers when platform opens
4. **Analytics Dashboard**: Track waitlist signups and conversion rates
5. **A/B Testing**: Test different early access modal designs

## Troubleshooting

### Modal Not Showing/Hiding After Toggle
- Clear browser cache and reload
- Check browser console for errors
- Verify database connection
- Ensure Prisma client is up to date: `npx prisma generate`

### Cannot Access Admin Settings
- Verify user has `ADMIN` role in database
- Check authentication session
- Review server logs for errors

### Database Sync Issues
```bash
# Reset and resync database (WARNING: loses data)
npx prisma migrate reset

# Or push changes without migration
npx prisma db push
```

## Support
For issues or questions, contact the development team or check the application logs.
