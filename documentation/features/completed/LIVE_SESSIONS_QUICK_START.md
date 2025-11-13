# Live Sessions Quick Start Guide

## 🎯 For Creators

### How to Schedule a Live Session

1. **Navigate to Live Sessions**
   - Click "Live Sessions" in the navigation bar
   - Or go to `/creator/live`

2. **Click "Schedule New Session"**
   - This opens the scheduling form

3. **Fill in Session Details**:
   - **Title (English)**: e.g., "Introduction to React Hooks"
   - **Title (Arabic)**: e.g., "مقدمة إلى React Hooks"
   - **Description (Optional)**: What you'll cover
   - **Scheduled Date & Time**: When you'll go live
   - **Duration**: 30, 60, 90, or 120 minutes
   - **Access Tier**: BRONZE, SILVER, GOLD, or ALL
   - **Max Attendees (Optional)**: Leave empty for unlimited

4. **Click "Schedule Session"**
   - Session appears in your sessions list
   - Members can see it in their feed

---

### How to Go Live

1. **Prepare Your Streaming Software**
   - Download OBS Studio (free): https://obsproject.com/
   - Or use Streamlabs, XSplit, etc.

2. **Start Your Session**
   - Go to Live Sessions list
   - Find your scheduled session
   - Click "Start Session" button

3. **Copy Streaming Credentials**
   - You'll see two items:
     - **RTMP Server URL**: `rtmp://stream.example.com/live/{id}`
     - **Stream Key**: A secret key (don't share!)
   - Click the copy button for each

4. **Configure OBS**:
   - Open OBS → Settings → Stream
   - Service: "Custom"
   - Server: Paste the RTMP URL
   - Stream Key: Paste your stream key
   - Click "OK"

5. **Set Up Your Scene**
   - Add sources: webcam, screen capture, overlays
   - Preview everything looks good

6. **Start Streaming**
   - Click "Start Streaming" in OBS
   - Your stream will appear live
   - Students can now join and watch

7. **Monitor Your Session**
   - Check attendee count in real-time
   - View chat messages
   - Respond to questions

8. **End the Session**
   - Click "End Session" button when done
   - Confirm the action
   - Session moves to "Ended" status
   - Statistics are saved

---

### Tips for a Great Live Session

✅ **Before Going Live**:
- Test your audio and video 5 minutes early
- Check your internet connection (min 5 Mbps upload)
- Prepare slides or materials
- Announce the session to your members

✅ **During the Session**:
- Start with a brief intro
- Engage with chat regularly
- Use screen sharing for demos
- Keep to your scheduled duration

✅ **After the Session**:
- Thank attendees
- Share any links or resources mentioned
- Review session stats
- Schedule follow-up sessions

---

## 🎓 For Members

### How to Join a Live Session

1. **Find Upcoming Sessions**
   - Go to your creator's channel
   - Look for "Upcoming Live Sessions"
   - Or check notifications

2. **Check Access Requirements**
   - Session shows required tier (Bronze/Silver/Gold)
   - Upgrade your membership if needed

3. **Join When Live**
   - Click "Join Session" when it starts
   - Video player loads automatically
   - You can chat with the creator

4. **Participate**
   - Watch the live stream
   - Send messages in chat
   - React with emojis
   - Ask questions

5. **Watch Replay**
   - If you miss it, watch the recording later
   - Available to members who have access

---

## 🔧 Troubleshooting

### Creator Issues

**Problem**: Can't start streaming  
**Solution**:
- Verify you clicked "Start Session" first
- Check OBS stream key is correct
- Ensure internet connection is stable
- Try restarting OBS

**Problem**: No viewers can see my stream  
**Solution**:
- Make sure OBS says "Live" (green indicator)
- Check stream URL is correct
- Verify session status is LIVE
- Ask a friend to test joining

**Problem**: Session ended but want to continue  
**Solution**:
- Cannot restart ended sessions
- Schedule a new session instead
- Consider making sessions longer (2 hours max)

---

### Member Issues

**Problem**: Can't join live session  
**Solution**:
- Check your membership tier matches requirement
- Refresh the page
- Clear browser cache
- Try a different browser

**Problem**: Video is buffering  
**Solution**:
- Check your internet speed (min 3 Mbps download)
- Close other tabs/apps using bandwidth
- Lower video quality if option available
- Move closer to WiFi router

**Problem**: Chat not working  
**Solution**:
- Refresh the page
- Check you're logged in
- Verify session is actually live
- Report to support if persists

---

## 📊 Understanding Session Stats

**View Count**: Total number of unique viewers who joined  
**Attendees**: Current number of people watching (live only)  
**Duration**: Actual time the session ran  
**Watch Time**: Total minutes watched by all attendees combined

---

## 🎨 Tier Access Explained

**BRONZE** 🥉: Basic members  
- Access to fundamental sessions
- General topics
- Large audience

**SILVER** 🥈: Premium members  
- Access to advanced sessions
- Specialized topics
- Medium audience

**GOLD** 🥇: VIP members  
- Access to exclusive sessions
- Private Q&A
- Small, intimate audience

**ALL** 💎: Public sessions  
- Anyone can join
- Great for promotions
- Maximum reach

---

## 📅 Best Practices

### Scheduling
- Schedule at least 3 days in advance
- Choose times when your audience is available
- Avoid overlapping with other creators
- Consider time zones of your members

### Duration
- **30 minutes**: Quick tips, Q&A sessions
- **60 minutes**: Standard tutorials, workshops
- **90 minutes**: In-depth courses, masterclasses
- **120 minutes**: Comprehensive training, projects

### Content Ideas
- Weekly office hours
- Live coding sessions
- Portfolio reviews
- Career advice
- Industry news discussions
- Guest speaker interviews

---

## ⚠️ Important Notes

### What's Currently Available
✅ Schedule sessions  
✅ Start/end sessions  
✅ Get streaming credentials  
✅ Track attendees  
✅ View statistics  

### Coming Soon
🔜 Real-time chat  
🔜 Session recording  
🔜 Automatic replays  
🔜 Polls and quizzes  
🔜 Screen sharing  

---

## 📞 Support

**Need Help?**
- Check the FAQ section
- Contact support: support@primeegypt.com
- Join creator community forum
- Watch tutorial videos

**Report a Bug**:
- Email: bugs@primeegypt.com
- Include session ID
- Describe what happened
- Attach screenshots if possible

---

**Last Updated**: 2025-01-09  
**Version**: 1.0  
**Feature Status**: Production Ready
