# 🚀 Quick Start Guide - Adaptive Training System

Welcome! Follow these steps to get your adaptive training system up and running.

## ✅ What's Already Done

I've built a complete foundation for your adaptive training system:

- ✅ Next.js 14 app with TypeScript
- ✅ Firebase integration (Auth, Firestore, Functions, App Hosting)
- ✅ Strava OAuth implementation with webhooks
- ✅ Training plan generator with heuristic-based logic
- ✅ Guardrails system (ramp rate, TSB, HIT restrictions)
- ✅ Time slot management for scheduling
- ✅ Camp and season goal support
- ✅ Firestore data models and security rules
- ✅ Cloud Functions for OAuth and webhooks
- ✅ Complete TypeScript type system

## 📋 Next Steps

### 1. Create Firebase Project

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create a new project or select existing one
firebase projects:list
```

Go to [Firebase Console](https://console.firebase.google.com/) and:

1. Create a new project (or select existing)
2. Enable **Firestore Database**
3. Enable **Authentication** → Add "Email/Password" provider
4. Enable **Cloud Functions** (Blaze plan required for external API calls)
5. Note your project credentials

### 2. Configure Environment Variables

Create `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in these values from Firebase Console → Project Settings:

```env
# Firebase Client (from "Your apps" section)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (from Service Accounts tab → Generate new private key)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Get Strava API Credentials

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application
3. Set Authorization Callback Domain to:
   - Development: `localhost:5001` (Firebase Functions emulator)
   - Production: `YOUR_REGION-YOUR_PROJECT.cloudfunctions.net`
4. Copy Client ID and Client Secret

Add to `.env.local`:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=random_string_here
```

### 4. Configure Firebase

```bash
# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Functions  
# - Hosting/App Hosting
# - Emulators (all: Auth, Firestore, Functions, Hosting)

# Use existing configurations when prompted
```

### 5. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Store Secrets in Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Store Strava Client Secret
echo -n "your_strava_client_secret" | gcloud secrets create strava-client-secret --data-file=-

# Store Webhook Verify Token
echo -n "your_random_verify_token" | gcloud secrets create strava-webhook-verify-token --data-file=-

# Grant Functions access to secrets
gcloud secrets add-iam-policy-binding strava-client-secret \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding strava-webhook-verify-token \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 7. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..

# Deploy functions
firebase deploy --only functions
```

You should see URLs like:
- `stravaOAuthCallback`: https://REGION-PROJECT.cloudfunctions.net/stravaOAuthCallback
- `stravaWebhook`: https://REGION-PROJECT.cloudfunctions.net/stravaWebhook

### 8. Configure Strava Webhook

```bash
# Subscribe to Strava webhooks
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_STRAVA_CLIENT_ID \
  -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
  -F callback_url=https://REGION-PROJECT.cloudfunctions.net/stravaWebhook \
  -F verify_token=YOUR_WEBHOOK_VERIFY_TOKEN
```

### 9. Run Locally

```bash
# Terminal 1: Start Firebase Emulators
npm run emulator

# Terminal 2: Start Next.js Dev Server
npm run dev
```

Open `http://localhost:3000`

## 🎯 Test the System

### Test Strava OAuth Flow

1. Go to `http://localhost:3000`
2. Click "Get Started"
3. Sign up with email/password
4. Go to Dashboard
5. Click "Connect Strava"
6. Authorize the app
7. You should be redirected back with activities

### Test Plan Generation

```typescript
// In your code or a test script
import { TrainingPlanGenerator } from '@/lib/planGenerator';
import { SlotManager } from '@/lib/slotManager';

const generator = new TrainingPlanGenerator();
const slots = SlotManager.generateDefaultSlots();

const plan = await generator.generateWeeklyPlan(
  userId,
  new Date(),
  {
    weeklyHours: 8,
    litRatio: 0.90,
    maxHitDays: 2,
    rampRate: 0.15,
    tsbTarget: 0,
    indoorAllowed: true,
    availableTimeSlots: slots,
    upcomingGoals: [],
  },
  [], // previous metrics
  []  // upcoming goals
);

console.log(plan);
```

## 📊 Key Files Explained

### Core Logic

- `src/lib/planGenerator.ts` - Generates weekly training plans
- `src/lib/slotManager.ts` - Manages time slots and camps
- `src/lib/firestore.ts` - Database operations
- `functions/src/index.ts` - Strava OAuth and webhooks

### Configuration

- `firestore.rules` - Security rules (IMPORTANT!)
- `firestore.indexes.json` - Database indexes
- `firebase.json` - Firebase project config

### Types

- `src/types/index.ts` - All TypeScript types

## 🔒 Security Checklist

- [ ] Firestore rules deployed
- [ ] Secrets in Secret Manager (not in code)
- [ ] `.env.local` in `.gitignore`
- [ ] App Check enabled (production)
- [ ] Rate limiting on Functions
- [ ] User data scoped by UID

## 🚢 Deploy to Production

```bash
# Build and deploy everything
npm run build
firebase deploy

# Or deploy individually
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore
```

## 🐛 Common Issues

### "Cannot find module" errors
Run `npm install` in both root and functions directories

### Firestore permission denied
Check that rules are deployed: `firebase deploy --only firestore:rules`

### OAuth redirect not working
Verify callback URL in Strava API settings matches your Cloud Function URL

### Secret Manager errors
Ensure Secret Manager API is enabled and IAM permissions are set

## 📈 What's Next?

### MVP Features (Priority)
1. ✅ Core plan generation
2. ⏳ User dashboard UI
3. ⏳ Activity sync from Strava
4. ⏳ Plan compliance tracking
5. ⏳ Manual plan adjustments

### Phase 2 (ML Enhancement)
1. BigQuery data pipeline
2. Feature engineering
3. Vertex AI model training
4. A/B testing framework

### Phase 3 (Advanced)
1. Wearable integration (HRV, sleep)
2. Coach dashboard
3. Mobile app
4. Advanced analytics

## 🆘 Need Help?

- Check logs: `firebase functions:log`
- Emulator UI: `http://localhost:4000`
- Firestore Console: Firebase Console → Firestore Database

## 🎉 You're Ready!

The foundation is solid. Now you can:
1. Test locally with emulators
2. Add more UI components
3. Integrate wearables
4. Deploy to production
5. Add ML models

Start with the emulators and build from there. The architecture is production-ready!

---

Built with ❤️ for cyclists. Let's make training smarter!