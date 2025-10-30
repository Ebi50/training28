# Installation Guide - Adaptive Training System

Complete step-by-step guide to set up your own instance of the Adaptive Training System.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Google Account** (for Firebase)
- **Strava Account** (for activity sync)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Ebi50/training28.git
cd training28
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., `my-training-app`)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

#### 3.2 Enable Firebase Services

**Authentication:**
1. In Firebase Console → **Authentication** → **Get Started**
2. Enable **Email/Password** sign-in method
3. Click **Save**

**Firestore Database:**
1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode**
3. Select your region (closest to your users)
4. Click **Enable**

**Storage:**
1. In Firebase Console → **Storage** → **Get Started**
2. Choose **Production mode**
3. Click **Done**

**Cloud Functions:**
1. In Firebase Console → **Functions**
2. Upgrade to **Blaze plan** (pay-as-you-go, includes free tier)
3. This is required for Strava OAuth

#### 3.3 Get Firebase Credentials

1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **Web** icon (`</>`)
3. Register app name: `Adaptive Training Web`
4. Copy the **Firebase config** values

#### 3.4 Create Service Account (for Admin SDK)

1. In Firebase Console → **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Save the JSON file securely (NEVER commit to git!)
4. You'll need the `client_email` and `private_key` values

### 4. Strava API Setup

#### 4.1 Create Strava Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Click **"Create App"** or **"My API Application"**
3. Fill in the form:
   - **Application Name**: `My Training App`
   - **Category**: `Training`
   - **Club**: (leave empty)
   - **Website**: `http://localhost:3001` (for development)
   - **Authorization Callback Domain**: `localhost`
   - **Description**: `Adaptive training system with ML-based planning`
4. Click **"Create"**

#### 4.2 Get Strava Credentials

After creating the app, you'll see:
- **Client ID**: (6-digit number)
- **Client Secret**: (40-character string)

**Important**: Keep these secret! Never commit to git.

### 5. Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and replace the placeholder values:

```bash
# Firebase Client Configuration (from step 3.3)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (from step 3.4 - service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Strava API (from step 4.2)
STRAVA_CLIENT_ID=123456
STRAVA_CLIENT_SECRET=your_40_character_secret_here
STRAVA_WEBHOOK_VERIFY_TOKEN=any_random_string_here

# NextJS
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3001

# Development
NODE_ENV=development
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 6. Deploy Firebase Configuration

#### 6.1 Login to Firebase

```bash
firebase login
```

#### 6.2 Initialize Firebase Project

```bash
firebase use --add
```

Select your Firebase project and give it an alias (e.g., `default`).

#### 6.3 Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

#### 6.4 Deploy Storage Rules

```bash
firebase deploy --only storage
```

#### 6.5 Upload ML Model Files

The ML model files are already in `scripts/` folder:
- `tss-predictor-v1.onnx` (2.05 MB)
- `tss-predictor-v1.json` (metadata)

**Option A: Via Script (Automated)**

```bash
node scripts/upload-to-storage.js
```

**Option B: Via Firebase Console (Manual)**

1. Go to Firebase Console → **Storage**
2. Create folder: `ml-models`
3. Upload both files from `scripts/` folder

#### 6.6 Deploy Cloud Functions

**Important**: Set Strava credentials in Firebase Secret Manager first:

```bash
# Set Strava Client ID
firebase functions:secrets:set STRAVA_CLIENT_ID
# Paste your Strava Client ID when prompted

# Set Strava Client Secret
firebase functions:secrets:set STRAVA_CLIENT_SECRET
# Paste your Strava Client Secret when prompted

# Set Webhook Verify Token
firebase functions:secrets:set STRAVA_WEBHOOK_VERIFY_TOKEN
# Paste any random string (same as in .env.local)
```

Now deploy the functions:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This will deploy:
- `stravaOAuth` - Handles Strava authentication
- `stravaWebhook` - Receives activity updates from Strava

**Note the function URLs** from the deployment output. You'll need them for Strava webhook setup.

### 7. Configure Strava Webhooks

1. Get your webhook callback URL from Cloud Functions deployment:
   ```
   https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/stravaWebhook
   ```

2. Create Strava webhook subscription:
   ```bash
   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
     -F client_id=YOUR_STRAVA_CLIENT_ID \
     -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
     -F callback_url=YOUR_WEBHOOK_URL \
     -F verify_token=YOUR_VERIFY_TOKEN
   ```

3. Verify subscription:
   ```bash
   curl -G https://www.strava.com/api/v3/push_subscriptions \
     -d client_id=YOUR_STRAVA_CLIENT_ID \
     -d client_secret=YOUR_STRAVA_CLIENT_SECRET
   ```

### 8. Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3001**

---

## 🧪 Testing the Installation

### 1. Create Test Account

1. Open http://localhost:3001
2. Click **"Get Started"**
3. Click **"Sign Up"**
4. Enter email and password (min 6 characters)
5. Click **"Sign Up"**

### 2. Configure Athlete Profile

1. You'll be redirected to **Settings**
2. Fill in your athlete data:
   - **Date of Birth**: Your birthdate
   - **Weight**: In kg
   - **FTP**: Functional Threshold Power in watts
   - **LTHR**: Lactate Threshold Heart Rate in bpm
   - **Max HR**: Maximum heart rate in bpm

3. Click **"Save Profile"**

### 3. Set Training Time Slots

1. Scroll to **"Training Time Slots"**
2. Click **"Add Zeitslot"** button
3. Select:
   - **Day**: Monday
   - **From**: 08:00
   - **To**: 09:00
   - **Type**: Indoor & Outdoor
4. Click **"Hinzufügen"**
5. Add more slots for other days
6. Click **"Save Time Slots"**

### 4. Connect Strava (Optional)

1. In Dashboard, click **"Connect Strava"** button
2. You'll be redirected to Strava authorization
3. Click **"Authorize"**
4. You'll be redirected back to the app
5. Your Strava activities will sync automatically

### 5. Generate Training Plan

1. Go to **Dashboard**
2. Click **"Generate Plan"** (when available)
3. View your personalized weekly training plan
4. Plan uses ML predictions if model is loaded

---

## 📦 Production Deployment

### Option 1: Firebase Hosting

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR-PROJECT-ID.web.app`

### Option 2: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 3: Firebase App Hosting (Recommended)

1. In Firebase Console → **App Hosting**
2. Connect your GitHub repository
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
4. Add environment variables from `.env.local`
5. Deploy

**Important**: Update Strava callback URL to your production domain!

---

## 🔒 Security Checklist

Before going to production:

- [ ] Never commit `.env.local` to git
- [ ] Use Firebase Secret Manager for all secrets in Cloud Functions
- [ ] Enable Firebase App Check for production
- [ ] Review Firestore security rules
- [ ] Review Storage security rules
- [ ] Set up proper CORS for API endpoints
- [ ] Enable rate limiting on Cloud Functions
- [ ] Update Strava callback URLs to production domain
- [ ] Set `NODE_ENV=production` in production environment

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

The app automatically tries port 3001. To force a specific port:

```bash
PORT=3002 npm run dev
```

### Firebase Admin Errors

**Error**: "The specified bucket does not exist"
- Solution: Check `FIREBASE_STORAGE_BUCKET` in `.env.local` matches your project

**Error**: "Credential implementation provided to initializeApp() is invalid"
- Solution: Verify `FIREBASE_PRIVATE_KEY` format (must include `\n` for newlines)

### Strava OAuth Not Working

**Error**: 404 on callback
- Solution: Deploy Cloud Functions first: `firebase deploy --only functions`

**Error**: "Invalid client"
- Solution: Check `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` are correct

### ML Model Not Loading

**Error**: Model file not found
- Solution: Upload model files to Storage: `node scripts/upload-to-storage.js`
- Or manually upload via Firebase Console

### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Strava API Documentation](https://developers.strava.com/)
- [Project README](./README.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Project Summary](./PROJECT_SUMMARY.md)

---

## 💬 Support

For issues or questions:
1. Check existing [GitHub Issues](https://github.com/Ebi50/training28/issues)
2. Create a new issue with detailed error logs
3. Include your environment details (OS, Node version, etc.)

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.
