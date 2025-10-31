# Adaptive Training System

An intelligent cycling training platform that generates personalized, adaptive training plans based on Strava data, wearable metrics, and ML-driven insights.

## ⚠️ WICHTIG: Design System

**🎨 ZENTRALES DESIGN SYSTEM IN VERWENDUNG!**

- **Alle neuen Komponenten MÜSSEN** das Design System verwenden
- **Datei:** `src/styles/designSystem.ts`
- **Quick Start:** Siehe `DESIGN_SYSTEM_QUICK_START.md`
- **Vollständige Doku:** Siehe `DESIGN_SYSTEM_MASTER.md`

```typescript
// In jeder Komponente/Seite:
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
```

**NIEMALS manuelle px/gap/p-Werte!** Nutze `spacing.*` und `components.*`

---

## 🚀 Features

- **Strava Integration**: Automatic activity sync and analysis
- **Adaptive Planning**: Weekly plans that adjust to your fitness and recovery
- **Smart Scheduling**: Respects your available time slots
- **Season Goals**: Plan around races and events with automatic tapering
- **Training Camps**: Special camp modes with volume adjustments and deload periods
- **Real-time Adaptation**: Plans update based on completed workouts and recovery metrics
- **Guardrails**: Built-in safety rules prevent overtraining

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase project with:
  - Firestore enabled
  - Authentication configured
  - Cloud Functions enabled
  - App Hosting (optional, for deployment)
- Strava API credentials

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Training2026
npm install
```

### 2. ⚠️ Important: Port Configuration

**The dev server MUST run on port 3001 (not 3000)!**

This is required for Strava OAuth integration, as the callback URL `http://localhost:3001/api/auth/strava/callback` is registered in the Strava API settings.

**Always access the app at: http://localhost:3001**

See [PORT_CONFIG.md](./PORT_CONFIG.md) for details.

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- Firebase configuration (API key, project ID, etc.)
- Strava Client ID and Secret
- Firebase Admin credentials

### 3. Initialize Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init
```

Select:
- Firestore
- Functions
- Hosting/App Hosting
- Emulators (Auth, Firestore, Functions, Hosting)

### 4. Set Up Firestore Security Rules

Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

### 5. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 6. Run Locally

```bash
# Start Firebase emulators (optional)
npm run emulator

# In another terminal, start Next.js dev server
# ⚠️ IMPORTANT: Server runs on PORT 3001 (for Strava OAuth)
npm run dev

# Open browser at: http://localhost:3001
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
Training2026/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── lib/                 # Core library code
│   │   ├── firebase.ts      # Firebase client config
│   │   ├── firebaseAdmin.ts # Firebase admin SDK
│   │   ├── firestore.ts     # Firestore data access
│   │   ├── planGenerator.ts # Training plan generation
│   │   └── slotManager.ts   # Time slot management
│   ├── types/               # TypeScript type definitions
│   └── styles/              # Global styles
├── functions/               # Cloud Functions
│   └── src/
│       └── index.ts         # Strava OAuth & webhooks
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore indexes
└── firebase.json            # Firebase configuration
```

## 🔧 Key Components

### Training Plan Generator

Generates weekly training plans using heuristic-based logic with guardrails:

```typescript
import { TrainingPlanGenerator } from '@/lib/planGenerator';

const generator = new TrainingPlanGenerator({
  maxRampRate: 0.15,
  noHitBackToBack: true,
  maxHitDuration: 90,
});

const plan = await generator.generateWeeklyPlan(
  userId,
  weekStartDate,
  parameters,
  previousMetrics,
  upcomingGoals,
  activeCamp
);
```

### Slot Manager

Manages time slots and scheduling constraints:

```typescript
import { SlotManager } from '@/lib/slotManager';

const availableSlots = SlotManager.getAvailableSlots(
  userSlots,
  targetDate,
  bookedSlots
);

const optimalSlot = SlotManager.findOptimalSlot(
  requiredDuration,
  availableSlots,
  preferences
);
```

### Camp & Season Management

```typescript
import { CampSeasonManager } from '@/lib/slotManager';

const activeCamp = CampSeasonManager.getActiveCamp(date, camps);
const { shouldTaper, goal } = CampSeasonManager.shouldTaper(date, goals);
```

## � Documentation

### Quick References
- **`EMA_QUICK_REF.md`** - EMA Formel auf einen Blick
- **`EMA_FORMEL_ERKLAERUNG.md`** - Ausführliche Mathematik-Erklärung mit Beispielen
- **`FITNESS_FORECAST.md`** - Fitness-Prognose System
- **`TESTING_GUIDE.md`** - Testing & Validation Guide
- **`DESIGN_SYSTEM_QUICK_START.md`** - Design System Quick Start
- **`PROJECT_SUMMARY.md`** - Projekt-Übersicht
- **`SETUP_GUIDE.md`** - Setup-Anleitung

### Core Concepts
- **CTL/ATL/TSB**: EMA-basierte Fitness-Metriken (siehe `EMA_FORMEL_ERKLAERUNG.md`)
- **Forecast**: Prognose zukünftiger Metriken (siehe `FITNESS_FORECAST.md`)
- **Morning Check**: Tägliche Readiness-Bewertung mit automatischer Plan-Anpassung
- **Session Adaptation**: Dynamische Trainingsanpassung basierend auf Zustand

## �📊 Data Model

### Collections

- `users/{uid}` - User profiles and settings
- `users/{uid}/integrations/strava` - Strava OAuth tokens
- `users/{uid}/planning/season_goals` - Season goals and races
- `users/{uid}/planning/camps` - Training camps
- `users/{uid}/plans` - Weekly training plans
- `users/{uid}/activities` - Training activities
- `fact_daily_metrics/{uid}/metrics/{date}` - Daily CTL/ATL/TSB metrics

## 🔐 Security

- Firestore rules enforce user-scoped data access
- OAuth tokens stored server-side only
- Secret Manager for API credentials
- App Check for client verification
- Rate limiting on Cloud Functions

## 🚢 Deployment

### Deploy to Firebase App Hosting

```bash
# Build Next.js app
npm run build

# Deploy everything
firebase deploy
```

### Deploy Functions Only

```bash
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 📈 Monitoring

- Cloud Logging: `https://console.cloud.google.com/logs`
- Error Reporting: `https://console.cloud.google.com/errors`
- Firestore Usage: Firebase Console

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Lint
npm run lint

# Run with emulators
npm run emulator
```

## 📝 Environment Variables

See `.env.local.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues and questions, please open a GitHub issue.

---

Built with Next.js, Firebase, and ❤️ for cyclists