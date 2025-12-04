# TaskFlow - Complete Setup Guide

This guide will walk you through setting up TaskFlow from scratch to Play Store submission.

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for testing) or physical Android device
- Supabase account (free tier works)
- Expo account (free)
- Google Play Console account ($25 one-time fee)

---

## 🚀 Step 1: Environment Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: taskflow-production
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your target users
4. Wait for project to initialize (~2 minutes)

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables were created in **Table Editor**

### 1.3 (Optional) Add Seed Data

1. In SQL Editor, create another new query
2. Copy contents of `supabase/seed.sql`
3. Run it to get sample tasks/projects for testing

### 1.4 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 1.5 Create Environment File

Create a file named `.env` in the `taskflow-todoist` directory:

```bash
# In /apps/taskflow-todoist/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_ENV=development
```

**⚠️ Important**: Never commit `.env` to git (it's already in .gitignore)

---

## 🎨 Step 2: Create App Assets

You need to create 4 image files in the `/assets` folder:

### Required Assets:
1. **icon.png** - 1024x1024px app icon
2. **adaptive-icon.png** - 1024x1024px (Android adaptive icon)
3. **splash.png** - 1284x2778px splash screen
4. **favicon.png** - 48x48px web favicon

### Quick Option: Generate Placeholder Assets

If you have ImageMagick installed:

```bash
cd apps/taskflow-todoist/assets

# Create simple purple icons with checkmark
convert -size 1024x1024 xc:"#6c5ce7" \
  -gravity center -pointsize 400 -fill white -annotate +0+0 "✓" \
  icon.png

convert -size 1284x2778 xc:"#6c5ce7" \
  -gravity center -pointsize 120 -fill white -annotate +0-200 "TaskFlow" \
  -pointsize 400 -annotate +0+200 "✓" \
  splash.png

cp icon.png adaptive-icon.png
convert icon.png -resize 48x48 favicon.png
```

**Better Option**: Use design tools:
- [Figma](https://figma.com) - Professional design
- [Canva](https://canva.com) - Easy templates
- [Icon Kitchen](https://icon.kitchen) - Auto-generate all sizes

See `assets/ASSETS_README.md` for detailed instructions.

---

## 💻 Step 3: Install Dependencies & Test Locally

```bash
# Navigate to project
cd apps/taskflow-todoist

# Install dependencies
pnpm install

# Start development server
pnpm expo start
```

### Test the App:

1. **In Terminal**: Press `a` to open on Android emulator, or `i` for iOS
2. **On Physical Device**:
   - Install "Expo Go" from Play Store
   - Scan QR code from terminal
3. **Test These Flows**:
   - Sign up with email/password
   - Create a task
   - Mark task complete
   - Create a project
   - Assign task to project
   - View stats

---

## 🏗️ Step 4: Configure EAS Build

### 4.1 Login to Expo

```bash
eas login
```

Enter your Expo account credentials (create one at expo.dev if needed).

### 4.2 Configure Project

```bash
eas build:configure
```

This will:
- Link to your Expo account
- Generate a project ID
- Update `app.json` with your project ID

### 4.3 Update app.json

Edit `app.json` and replace:
- `"owner": "your-expo-username"` → your actual Expo username
- Bundle identifiers if needed (keep `com.appspree.taskflow` or change to your domain)

---

## 📱 Step 5: Build for Android

### 5.1 Create Development Build (for testing)

```bash
eas build --platform android --profile preview
```

This creates an APK you can install on devices for testing.

**Wait Time**: ~10-15 minutes for first build

When complete:
1. Download APK from the link provided
2. Transfer to Android device
3. Install and test thoroughly

### 5.2 Create Production Build (for Play Store)

```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) optimized for Play Store.

**Output**: You'll get a `.aab` file download link

---

## 🎯 Step 6: Prepare Play Store Listing

### 6.1 Create Screenshots

Take screenshots on different devices:
- Phone (minimum 2 screenshots)
- 7-inch tablet (optional but recommended)
- 10-inch tablet (optional)

**Recommended Tool**: Use Android emulator or physical device
- Show key features: task list, creating task, projects, stats
- Keep UI clean (no personal data)
- Highlight the purple branding

### 6.2 Write Store Listing

**Short Description** (80 characters max):
```
Organize your life with beautiful task management
```

**Full Description** (up to 4000 characters):
```
TaskFlow - Simple, Beautiful Task Management

Get things done with TaskFlow, the elegant task manager that helps you stay organized and productive.

✓ SMART TASK ORGANIZATION
• Inbox for quick capture
• Today view for daily focus
• Upcoming tasks for planning ahead
• Color-coded projects for better organization

✓ POWERFUL FEATURES
• 4-level priority system (Low, Medium, High, Urgent)
• Due date scheduling
• Project management with custom colors
• Smart search across all tasks
• Quick-add for fast task creation

✓ PRODUCTIVITY INSIGHTS
• Track your completion streak
• View productivity statistics
• Discover your most productive times
• Analyze tasks by project and priority

✓ CLEAN & MODERN DESIGN
• Beautiful purple-themed interface
• Intuitive navigation
• Fast and responsive
• No ads or distractions

✓ PRIVACY FIRST
• Your data is encrypted and secure
• No unnecessary permissions
• Sign in with email only
• Delete your account anytime

Perfect for:
→ Students managing assignments
→ Professionals organizing work projects
→ Anyone who wants to be more productive

Download TaskFlow today and start getting things done!

---
Support: [your-email]@gmail.com
Privacy Policy: [your-website]/privacy
```

### 6.3 Prepare Additional Assets

Create these in any design tool:

**Feature Graphic**: 1024x500px
- Show app name "TaskFlow" and tagline
- Include app icon or screenshot
- Purple (#6c5ce7) branding

**Promo Video** (optional):
- 30-second demo of key features
- Upload to YouTube as unlisted
- Paste YouTube link in Play Console

---

## 🚀 Step 7: Submit to Play Store

### 7.1 Create Google Play Console Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete developer profile
4. Verify your identity (may take 1-2 days)

### 7.2 Create App

1. Click "Create App"
2. Fill in:
   - **App name**: TaskFlow
   - **Default language**: English (US)
   - **App type**: Application
   - **Free or Paid**: Free
3. Accept declarations

### 7.3 Complete Store Listing

Navigate through left sidebar and complete all sections:

**Main Store Listing**:
- Upload icon (512x512px - resize your icon.png)
- Upload feature graphic (1024x500px)
- Add screenshots (minimum 2)
- Write short & full description
- Add app category: Productivity
- Add contact email

**App Content**:
- **Privacy Policy**: Required! (See Step 8)
- **App Access**: All functionality available without special access
- **Ads**: Select "No, my app does not contain ads"
- **Content Rating**: Complete questionnaire (likely rated E for Everyone)
- **Target Audience**: Select age groups
- **News App**: No
- **COVID-19**: Not applicable
- **Data Safety**: Complete form about data collection

**Important - Data Safety Form**:
- Collects: Email addresses (required for account)
- Location: Not collected
- Encryption: Data encrypted in transit
- Can users request deletion: Yes
- Data retention policy: Retained until account deletion

### 7.4 Upload Build

1. Go to **Production** → **Releases**
2. Click "Create new release"
3. Upload the `.aab` file from EAS Build
4. Write release notes (e.g., "Initial release")
5. Review and click "Save"
6. Click "Send X changes for review"

### 7.5 Review Process

- **Review time**: 1-7 days (usually 2-3 days)
- You'll get email updates
- May get feedback for changes needed
- Once approved, app goes live!

---

## 📄 Step 8: Legal Requirements

### 8.1 Create Privacy Policy

You MUST have a privacy policy. Use this template:

```markdown
# Privacy Policy for TaskFlow

Last updated: [DATE]

## Information We Collect
- Email address (for account creation)
- Tasks, projects, and productivity data you create
- App usage statistics

## How We Use Your Information
- Provide and maintain the app
- Send important account updates
- Improve app functionality

## Data Storage
- Data stored securely via Supabase (encrypted)
- Hosted in [YOUR SUPABASE REGION]
- You can delete your account and data anytime

## Third-Party Services
- Supabase (database and authentication)
- Expo (app infrastructure)

## Your Rights
- Access your data
- Request data deletion
- Export your data

## Contact
For privacy questions: [your-email]@gmail.com
```

**Host this**: 
- GitHub Pages (free): Create repo, enable Pages, upload privacy.html
- Or use [PrivacyPolicies.com](https://www.privacypolicies.com/live/free)
- Add URL to Play Store listing

### 8.2 Create Terms of Service (Optional but Recommended)

Simpler version:

```markdown
# Terms of Service

By using TaskFlow, you agree to:
- Use the app legally and responsibly
- Not abuse or hack the service
- Maintain security of your account

We provide the app "as is" without warranties.
```

---

## ✅ Launch Checklist

Before submitting, verify:

- [ ] App builds and runs without crashes
- [ ] All CRUD operations work (create, read, update, delete tasks)
- [ ] Sign up and login work
- [ ] Projects can be created and managed
- [ ] Stats load correctly
- [ ] Search works
- [ ] All assets present (icon, splash, etc.)
- [ ] Privacy policy live and linked
- [ ] Store listing complete with screenshots
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] Release notes written
- [ ] AAB file uploaded
- [ ] Tested on at least 2 different Android devices/versions

---

## 🎉 Post-Launch

### Monitor
- Check Play Console for crash reports daily
- Respond to user reviews within 24-48 hours
- Track download numbers and ratings

### Update Strategy
- Fix critical bugs ASAP (use `eas build` + new release)
- Monthly feature updates
- Respond to user feature requests

### Marketing
- Share on social media
- Post on Reddit (r/androidapps, r/productivity)
- Submit to Product Hunt
- Ask friends/family for initial reviews

---

## 🆘 Troubleshooting

### "Supabase connection failed"
- Check `.env` file exists and has correct credentials
- Verify Supabase project is active
- Check RLS policies are enabled

### "Build failed on EAS"
- Check `eas.json` is valid JSON
- Verify `app.json` package names are lowercase with no spaces
- Check pnpm-lock.yaml is committed

### "App rejected from Play Store"
- Most common: Missing privacy policy
- Fix: Add privacy policy URL in store listing
- Also check: Content rating, Data safety form completed

### "Can't install APK on device"
- Enable "Install from unknown sources" in Android settings
- Verify APK downloaded completely
- Try different file transfer method

---

## 📞 Support Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Supabase Docs**: https://supabase.com/docs
- **Play Console Help**: https://support.google.com/googleplay/android-developer

---

**You're all set! Good luck with your launch! 🚀**

