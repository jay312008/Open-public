# LearnyMol — AI-Powered Mobile Learning Application

LearnyMol is an Android-first (iOS & Web compatible) Expo + React Native + TypeScript educational platform featuring **Molly Live Teacher**, an interactive **Learning Journey** winding-road world, **My Subjects**, **AI Study Tools**, a **Student Community**, and **Leaderboards**.

## Quick Start

```bash
npm install --legacy-peer-deps
npx expo start
```

### 1. Physical Android Phone (Recommended: Custom Development Build)
For full native integrations (Molly Live Teacher voice, haptics, notifications):
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in to your Expo account: `eas login`
3. Build an installable Android Development APK:
   ```bash
   npm run build:android:dev
   ```
4. Install the generated `.apk` on your Android phone, then run `npx expo start --dev-client` and scan the QR code.

*(You can also preview quickly in **Expo Go** by scanning the QR code from `npx expo start`.)*

### 2. Android Studio Emulator
1. Open Android Studio → Device Manager → Start an Android Virtual Device (AVD).
2. Run:
   ```bash
   npm run android
   ```

### 3. Web Preview & Vercel Deployment
```bash
npm run web
```
To build the static web bundle (configured in `vercel.json`):
```bash
npm run export:web
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Optional (local fallback active) | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional (local fallback active) | Your Supabase public anon key |
| `EXPO_PUBLIC_AI_GATEWAY_URL` | Optional (prototype fallback active) | Server-side AI gateway endpoint (never put LLM API keys in `EXPO_PUBLIC_*`) |
| `EXPO_PUBLIC_DEFAULT_TEST_CREDITS` | Optional | Default testing credit balance (default: `250`) |

## Database Migrations (Supabase)

Apply `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor or via `supabase db push`. It creates tables and Row Level Security (RLS) policies for profiles, journey plans, levels, lessons, idempotent XP events, badges, community posts, likes, comments, follows, and saved AI conversations.

## Verification

```bash
npm run typecheck
npm run export:web
```
