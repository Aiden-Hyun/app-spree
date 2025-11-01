# WakeNWin - Alarmy Clone

A feature-rich alarm clock app that makes waking up engaging and effective through various challenges, tracking, and motivational elements.

## Features

### 🎯 Wake-Up Challenges

- **Basic**: Simple dismiss button
- **Math Problems**: Solve arithmetic problems of varying difficulty
- **Shake Challenge**: Shake your phone a certain number of times
- **Photo Mission**: Take a photo matching a reference image
- **Memory Game**: Repeat number sequences
- **Typing Challenge**: Type motivational phrases

### ⏰ Alarm Management

- Create, edit, and delete multiple alarms
- Recurring alarms with day selection
- Custom labels for each alarm
- Quick enable/disable toggles
- Snooze limits and penalties

### 😴 Sleep Features

- Sleep tracking with manual start/stop
- Sleep sounds (Rain, Ocean, White Noise, Forest)
- Power nap timer (15, 20, 30, 45 minutes)
- Bedtime reminders
- Sleep quality tracking

### 📊 Statistics & Progress

- Wake-up streak counter
- Total challenges completed
- Weekly wake-up chart
- Achievement badges
- Sleep duration tracking

### 👤 Profile & Settings

- User profile management
- Customizable preferences
  - Default challenge type
  - Snooze limit
  - Gradual volume increase
  - Bedtime reminders
- Notification management

## Tech Stack

- **Frontend**: React Native with Expo SDK 51
- **Navigation**: Expo Router v3
- **Backend**: Supabase (Auth, Database, Storage)
- **Notifications**: Expo Notifications
- **Sensors**: Expo Sensors (Accelerometer)
- **Audio**: Expo AV
- **Camera**: Expo Camera
- **Location**: Expo Location (for weather)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:
   Create a `.env.local` file with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WEATHER_API_KEY=your_openweather_api_key # Optional
```

3. Set up Supabase:

- Run the SQL schema in `supabase/schema.sql`
- Optionally run `supabase/seed.sql` for sample alarm sounds

4. Add alarm sound:

- Add an MP3 file named `alarm-sound.mp3` to the `assets` directory

5. Run the app:

```bash
pnpm start
```

## Project Structure

```
apps/wakenwin-alarmy/
├── app/
│   ├── (tabs)/          # Tab navigation screens
│   ├── alarm/           # Alarm create/edit screens
│   ├── challenge/       # Wake-up challenge screens
│   └── onboarding/      # Onboarding flow
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
└── supabase/           # Database schema and seeds
```

## Permissions Required

- **Notifications**: For alarm alerts
- **Camera**: For photo challenges (optional)
- **Motion**: For shake challenges (optional)
- **Location**: For weather display (optional)

## Future Enhancements

- [ ] QR/Barcode scan challenge
- [ ] Step counter challenge
- [ ] News briefing integration
- [ ] Social features (compete with friends)
- [ ] Cloud backup of alarm settings
- [ ] More alarm sounds and customization
- [ ] Smart alarm (wake during light sleep phase)
- [ ] Integration with smart home devices
