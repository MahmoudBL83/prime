# Messaging Tabs Update - Database Migration

This update adds new messaging features including mentors tab, study buddies tab, recommended users, and message request functionality.

## New Database Models

1. **MessageRequest** - Handles message requests from strangers (like Facebook)
2. **BlockedUser** - Handles blocked users

## Migration Steps

Run the following command to create and apply the migration:

```powershell
npx prisma migrate dev --name add-message-requests-and-blocked-users
```

Or if you prefer to just push the schema changes without creating a migration:

```powershell
npx prisma db push
```

## New API Endpoints

### Mentors
- `GET /api/mentors/my-mentors` - Get all mentors (course creators) the user is enrolled with

### Study Buddies
- `GET /api/study-buddies/my-buddies` - Get all active study buddy matches

### Recommended Users
- `GET /api/users/recommended` - Get recommended users based on shared courses and mutual connections

### Message Requests
- `GET /api/messaging/requests` - Get all pending message requests
- `POST /api/messaging/requests/[requestId]/approve` - Approve a message request
- `POST /api/messaging/requests/[requestId]/reject` - Reject a message request
- `POST /api/messaging/requests/[requestId]/block` - Block the sender and reject the request

## Features

### 1. New Messaging Tabs
- **Inbox** - Direct messages (existing)
- **Groups** - Group conversations (existing)
- **Archived** - Archived conversations (existing)
- **Mentors** - Conversations with course creators/mentors
- **Study Buddies** - Conversations with matched study buddies
- **Recommended** - Suggested users to message (like Facebook "People You May Know")

### 2. Message Request System
When a user sends a message to someone they haven't talked to before from the "Recommended" tab:
- The recipient receives a **message request**
- The recipient can:
  - **Accept** - Creates a conversation and allows future messaging
  - **Reject** - Removes the request without creating a conversation
  - **Block** - Blocks the sender from sending future requests

### 3. Recommended Users
The system recommends users based on:
- Shared course enrollments
- Mutual connections (people both users have conversations with)
- Users are sorted by number of mutual connections

## UI Changes

### Tabs Layout
The tabs are now displayed in two rows:
- **Row 1:** Inbox | Groups | Archived
- **Row 2:** Mentors | Study Buddies | Recommended

### Message Request Banner
When there are pending message requests, a banner appears at the top of the Inbox tab showing the count.

### Recommended Tab
Shows a list of suggested users with:
- Profile picture
- Name
- Mutual connections count
- "Message" button to initiate contact

## Testing

1. **Mentors Tab:**
   - Enroll in a course
   - Go to messaging → Mentors tab
   - You should see the course creator

2. **Study Buddies Tab:**
   - Create a study buddy match with another user
   - Go to messaging → Study Buddies tab
   - You should see your study buddy

3. **Recommended Tab:**
   - System will show users enrolled in the same courses
   - Click "Message" to send a message request

4. **Message Requests:**
   - Send a message to a recommended user
   - The recipient should see a message request
   - Test Accept, Reject, and Block actions
