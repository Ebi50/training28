# 🧪 Test Implementation Guide - Quick Reference

## Schnellstart für später

Wenn du bereit bist, die Tests zu vervollständigen, folge dieser Anleitung Schritt für Schritt.

---

## Phase 1: Unit Tests reparieren (1-2 Stunden)

### Schritt 1: Firebase Mocks hinzufügen

**In `test/unit/planGenerator.test.ts`** - Ganz oben nach den imports:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Firebase mocken
vi.mock('../../src/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  functions: {},
}));

vi.mock('../../src/lib/firebaseAdmin', () => ({
  default: {
    firestore: () => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(),
          set: vi.fn(),
          update: vi.fn(),
        })),
      })),
    }),
  },
}));
```

**In `test/unit/fitnessMetrics.test.ts`** - Simplify, keine Firebase-Imports nötig!

**In `test/unit/readinessCalculator.test.ts`** - Simplify, keine Firebase-Imports nötig!

### Schritt 2: Type-Fehler beheben

**slotManager.test.ts** (Zeile 18):
```typescript
// VORHER:
expect(slots[0]).toHaveProperty('duration');

// NACHHER:
expect(slots[0]).toHaveProperty('durationMinutes');
// oder checke die echte Struktur mit:
console.log(slots[0]);
```

### Schritt 3: Tests ausführen
```bash
npm run test:run
```

**Erwartung**: Alle Unit Tests bestehen ✅

---

## Phase 2: Integration Tests (4-6 Stunden)

### Schritt 1: Dependencies installieren
```bash
npm install --save-dev --legacy-peer-deps node-mocks-http @types/node-mocks-http
```

### Schritt 2: Test Fixtures erstellen

**Datei: `test/fixtures/users.ts`**
```typescript
export const mockUsers = {
  testUser: {
    id: 'test-user-123',
    email: 'test@example.com',
    ftp: 250,
    lthr: 165,
    weight: 75,
  },
};
```

**Datei: `test/fixtures/activities.ts`**
```typescript
export const mockActivities = [
  {
    id: 'activity-1',
    date: '2025-11-01',
    type: 'Ride',
    movingTimeSeconds: 3600,
    averagePower: 200,
    tss: 64,
  },
];
```

### Schritt 3: API Test erstellen

**Datei: `test/integration/api-adapt-plan.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../src/app/api/adapt-plan/route';

// Firestore mocken
vi.mock('../../src/lib/firebaseAdmin', () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ ctl: 50, atl: 45, tsb: 5 }),
        })),
        set: vi.fn(),
        update: vi.fn(),
      })),
    })),
  },
}));

describe('POST /api/adapt-plan', () => {
  it('should adapt plan for low readiness', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'test-user',
        morningCheck: {
          sleepQuality: 2,
          sleepHours: 5,
          stressLevel: 4,
          musclesSoreness: 4,
          motivation: 2,
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty('adapted');
    expect(data.adapted).toBe(true);
  });
});
```

### Schritt 4: Tests ausführen
```bash
npm run test:run test/integration/
```

---

## Phase 3: Component Tests (6-8 Stunden)

### Schritt 1: Next.js Router mocken

**In jedem Component Test:**
```typescript
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/dashboard',
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));
```

### Schritt 2: Component Test Beispiel

**Datei: `test/components/FitnessForecast.test.tsx`**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FitnessForecast from '../../src/components/FitnessForecast';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      current: { ctl: 60, atl: 55, tsb: 5 },
      forecast: [
        { date: '2025-11-02', ctl: 61, atl: 56, tsb: 5 },
      ],
    }),
  })
) as any;

describe('FitnessForecast', () => {
  it('renders and fetches forecast data', async () => {
    render(<FitnessForecast userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText(/CTL/i)).toBeInTheDocument();
    });
  });
});
```

### Schritt 3: Tests ausführen
```bash
npm run test:run test/components/
```

---

## Phase 4: E2E Tests (Optional, 1-2 Tage)

### Schritt 1: Playwright installieren
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Schritt 2: Playwright Config

**Datei: `playwright.config.ts`**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'npm run dev',
    port: 3001,
  },
});
```

### Schritt 3: E2E Test Beispiel

**Datei: `e2e/dashboard-flow.spec.ts`**
```typescript
import { test, expect } from '@playwright/test';

test('user can navigate dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Check if dashboard loads
  await expect(page.locator('h1')).toContainText('Dashboard');
  
  // Navigate to plan
  await page.click('text=Training Plan');
  await expect(page).toHaveURL(/\/dashboard\/plan/);
});
```

### Schritt 4: E2E Tests ausführen
```bash
npx playwright test
```

---

## Quick Commands Reference

```bash
# Alle Tests
npm test

# Unit Tests only
npm run test:run test/unit/

# Integration Tests only
npm run test:run test/integration/

# Component Tests only
npm run test:run test/components/

# Coverage Report
npm run test:coverage

# Tests with UI
npm run test:ui

# E2E Tests
npx playwright test
```

---

## Checkliste für später

### Unit Tests ✅
- [ ] Firebase Mocks in planGenerator.test.ts
- [ ] Type-Fehler in fitnessMetrics.test.ts beheben
- [ ] Type-Fehler in readinessCalculator.test.ts beheben
- [ ] SlotManager property name fix
- [ ] Alle Unit Tests laufen durch

### Integration Tests
- [ ] node-mocks-http installieren
- [ ] Test Fixtures erstellen
- [ ] /api/adapt-plan testen
- [ ] /api/fitness/forecast testen
- [ ] Firestore Mocks für alle API Routes

### Component Tests
- [ ] Next.js Router mocken
- [ ] FitnessForecast testen
- [ ] WeeklyPlanView testen
- [ ] NotificationBell testen
- [ ] DashboardLayout testen

### E2E Tests (Optional)
- [ ] Playwright installieren
- [ ] Login Flow testen
- [ ] Dashboard Flow testen
- [ ] Morning Check Flow testen
- [ ] Plan Generation Flow testen

---

## Troubleshooting

### Problem: "Cannot find module"
**Lösung**: 
```bash
npm install --legacy-peer-deps
```

### Problem: "Firebase Auth Error"
**Lösung**: Mock hinzufügen (siehe Phase 1)

### Problem: "Window is not defined"
**Lösung**: In vitest.config.ts:
```typescript
test: {
  environment: 'jsdom',
}
```

### Problem: "Chart.js Error"
**Lösung**: Chart.js mocken:
```typescript
vi.mock('react-chartjs-2', () => ({
  Line: () => null,
}));
```

---

## Zeitplan

| Phase | Dauer | Wann |
|-------|-------|------|
| Unit Tests Fix | 1-2h | Jederzeit |
| Integration Tests | 4-6h | Nach Unit Tests |
| Component Tests | 6-8h | Nach Integration Tests |
| E2E Tests | 1-2 Tage | Optional |

---

## Ergebnis nach Completion

- ✅ 60-70% Test Coverage
- ✅ Alle kritischen Funktionen getestet
- ✅ Sichere Refactorings möglich
- ✅ Automatisierte Regression-Tests
- ✅ CI/CD Ready

---

*Bereit zum Testen? Starte mit Phase 1! 🚀*
*Fragen? Check TEST_REPORT.md und TEST_SUMMARY.md*
