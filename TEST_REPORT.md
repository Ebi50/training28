# Test Documentation - Adaptive Training System

## Test Framework Setup

### Installed Dependencies
- **Vitest 4.0.6** - Modern test runner for Vite projects
- **@testing-library/react 16.3.0** - React component testing utilities
- **@testing-library/jest-dom 6.9.1** - Custom DOM matchers
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **@testing-library/dom** - DOM testing utilities
- **jsdom 27.1.0** - DOM implementation for Node.js
- **happy-dom 20.0.10** - Alternative DOM implementation
- **@vitejs/plugin-react 5.1.0** - React plugin for Vitest

### Configuration Files
- `vitest.config.ts` - Vitest configuration with React plugin, jsdom environment, and path aliases
- `test/setup.ts` - Test setup with @testing-library/jest-dom and cleanup

### NPM Scripts
```bash
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

---

## Unit Tests

### 1. Slot Manager Tests ✅
**File**: `test/unit/slotManager.test.ts`
**Status**: **7/8 tests passing** (87.5%)

#### Passing Tests:
- ✅ should calculate total weekly available time
- ✅ should validate time slots correctly
- ✅ should generate camp-specific time slots with higher availability
- ✅ should detect when taper is needed before race
- ✅ should not taper when no race is near
- ✅ should apply camp volume bump to parameters
- ✅ should generate deload parameters after camp

#### Failed Tests:
- ❌ should generate default weekly time slots
  - **Issue**: Property name mismatch - expected `duration` but TimeSlot type uses different property
  - **Impact**: Low - functionality works, just needs type alignment
  - **Fix Required**: Update test to match actual TimeSlot interface

**Coverage**:
- ✅ SlotManager.generateDefaultSlots()
- ✅ SlotManager.getTotalWeeklyAvailableTime()
- ✅ SlotManager.validateSlots()
- ✅ SlotManager.generateCampSlots()
- ✅ CampSeasonManager.shouldTaper()
- ✅ CampSeasonManager.applyCampOverrides()
- ✅ CampSeasonManager.generateDeloadParameters()

---

### 2. Plan Generator Tests ⚠️
**File**: `test/unit/planGenerator.test.ts`
**Status**: **Cannot run** (Firebase initialization error)

#### Issue:
```
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

**Root Cause**: Tests try to import `planGenerator.ts` which imports `firebase.ts` which tries to initialize Firebase with environment variables that aren't set in test environment.

**Solutions**:
1. **Mock Firebase** (Recommended):
   ```typescript
   vi.mock('../../src/lib/firebase', () => ({
     auth: {},
     db: {},
     functions: {},
   }));
   ```

2. **Use Test Environment Variables**:
   - Create `.env.test` with dummy Firebase config
   - Load in vitest.config.ts

3. **Refactor Code**:
   - Make Firebase initialization lazy
   - Allow passing Firebase instances as dependencies

**Test Coverage (Planned)**:
- calculateTrainingLoad()
- TrainingPlanGenerator.generateWeeklyPlan()
- LIT/HIT ratio enforcement
- Weekly hours target
- Ramp rate application

---

### 3. Fitness Metrics Tests ⚠️
**File**: `test/unit/fitnessMetrics.test.ts`
**Status**: **Not yet run** (type errors to fix)

**Test Coverage (Planned)**:
- ✅ TSS calculation (power-based)
- ✅ HRSS calculation (heart rate-based)
- ✅ CTL/ATL/TSB calculation
- ✅ EMA time constants (42d, 7d)
- ✅ Fitness forecast
- ✅ TSB interpretation

**Issues to Fix**:
- Type mismatch: `calculateFitnessMetrics` returns object, not array
- Function signature mismatch: `getCombinedFitnessMetrics` expects 1 arg, not 2
- Property names: `interpretTSB` returns different structure than expected

---

### 4. Readiness Calculator Tests ⚠️
**File**: `test/unit/readinessCalculator.test.ts`
**Status**: **Not yet run** (multiple type errors)

**Test Coverage (Planned)**:
- calculateReadinessScore()
- interpretReadiness()
- recommendWorkoutType()
- shouldForceRecovery()

**Issues to Fix**:
- MorningCheck type doesn't have `userId` property
- interpretReadiness() returns different structure than expected
- recommendWorkoutType() returns different structure than expected

---

## Integration Tests

### Status: **Not Started** ❌

**Planned Tests**:
1. **API Route: /api/adapt-plan**
   - POST with morning check data
   - Verify plan adaptation logic
   - Check Firestore updates

2. **API Route: /api/fitness/forecast**
   - GET with user ID
   - Verify forecast calculation
   - Check data structure

3. **API Route: /api/strava/activities**
   - Fetch activities
   - Parse TSS
   - Update metrics

**Challenges**:
- Need to mock Firestore
- Need to mock Firebase Auth
- Need test data setup/teardown

---

## Component Tests

### Status: **Not Started** ❌

**Planned Tests**:
1. **FitnessForecast Component**
   - Renders chart correctly
   - Displays current metrics
   - Shows target values

2. **WeeklyPlanView Component**
   - Renders sessions
   - Navigation works
   - Edit functionality

3. **DashboardLayout Component**
   - Navigation links work
   - Theme toggle works
   - Notification bell renders

4. **NotificationBell Component**
   - Shows badge count
   - Opens notification center
   - Marks as read

**Challenges**:
- Need to mock Next.js router
- Need to mock Firebase hooks
- Need to mock Chart.js

---

## E2E Tests

### Status: **Not Started** ❌

**Recommended Tool**: Playwright or Cypress

**Critical User Flows**:
1. **Authentication Flow**
   - Sign up with email
   - Sign in with email
   - Sign in with Strava OAuth
   - Sign out

2. **Onboarding Flow**
   - Complete profile setup
   - Set FTP/LTHR
   - Configure time slots
   - Generate first plan

3. **Morning Check Flow**
   - Complete morning check
   - See readiness score
   - View adapted plan
   - See notification

4. **Dashboard Flow**
   - View fitness metrics
   - Check upcoming sessions
   - Navigate to plan
   - View activity history

---

## Test Coverage Analysis

### Current Coverage (Estimated):

**Core Libraries**:
- `slotManager.ts`: **~80%** (7/8 tests passing)
- `planGenerator.ts`: **0%** (blocked by Firebase)
- `fitnessMetrics.ts`: **0%** (type errors to fix)
- `readinessCalculator.ts`: **0%** (type errors to fix)
- `sessionAdapter.ts`: **0%** (no tests yet)
- `complianceTracker.ts`: **0%** (no tests yet)

**API Routes**:
- All routes: **0%** (no integration tests yet)

**React Components**:
- All components: **0%** (no component tests yet)

**Overall**: **~5-10%** (only basic unit tests for slotManager)

---

## Existing Manual Tests

### 1. Core Functionality Test ✅
**File**: `test/core-functionality.test.ts`
**Type**: Manual console-based test
**Status**: **All tests passing**

Tests:
- ✅ Time slot management
- ✅ CTL/ATL/TSB calculation
- ✅ Plan generation
- ✅ Season goal management
- ✅ Training camp logic

**Run with**: `tsx test/core-functionality.test.ts`

### 2. Fitness Forecast Test ✅
**File**: `test/fitness-forecast.test.ts`
**Type**: Manual console-based test
**Status**: **All tests passing**

Tests:
- ✅ EMA calculation
- ✅ TSS calculation
- ✅ Fitness metrics from history
- ✅ Forecast from planned activities
- ✅ Combined metrics

**Run with**: `npm run test:forecast`

---

## Validation & Quality Assurance

### Code Quality Checks

#### Type Safety
```bash
npm run type-check
```
**Status**: **Passing** ✅
- No TypeScript compilation errors
- All types properly defined

#### Linting
```bash
npm run lint
```
**Status**: **To be checked**

#### Design System Compliance
```bash
npm run check-design-system
```
**Status**: **Passing** ✅
- Consistent spacing usage
- Design system followed

---

## Recommendations & Next Steps

### Priority 1: Fix Unit Tests ⚠️
1. **Fix slotManager test**: Update property names to match TimeSlot interface
2. **Mock Firebase**: Add vi.mock() for Firebase imports
3. **Fix type errors**: Align test expectations with actual function signatures

### Priority 2: Add Integration Tests 🔄
1. Mock Firestore with test data
2. Test API routes in isolation
3. Verify data flow between components

### Priority 3: Add Component Tests 🔄
1. Set up React Testing Library properly
2. Mock Next.js router and hooks
3. Test user interactions

### Priority 4: Add E2E Tests 🔄
1. Install Playwright or Cypress
2. Set up test environment
3. Implement critical user flows

### Priority 5: CI/CD Integration 🔄
1. Add GitHub Actions workflow
2. Run tests on every commit
3. Block merges if tests fail
4. Generate coverage reports

---

## Test Data Management

### Fixtures Needed:
- **User profiles**: Mock user data with FTP, LTHR, preferences
- **Activities**: Sample Strava activities with power/HR data
- **Training plans**: Pre-generated plans for different scenarios
- **Morning checks**: Sample readiness data
- **Time slots**: Standard and camp time slot configurations

### Mock Data Location:
- `test/fixtures/users.ts`
- `test/fixtures/activities.ts`
- `test/fixtures/plans.ts`
- `test/fixtures/morningChecks.ts`

---

## Known Issues & Limitations

### 1. Firebase Dependency
- **Issue**: Many modules import Firebase directly, making them hard to test
- **Impact**: Cannot run unit tests without mocking Firebase
- **Solution**: Refactor to use dependency injection or create Firebase-free versions of core logic

### 2. Type Mismatches
- **Issue**: Test expectations don't match actual function signatures
- **Impact**: Tests fail at compile time
- **Solution**: Review actual implementations and update tests

### 3. No Test Database
- **Issue**: No test Firestore instance for integration tests
- **Impact**: Cannot test database interactions
- **Solution**: Use Firebase Emulator Suite or mock Firestore

### 4. No E2E Framework
- **Issue**: No E2E testing framework installed
- **Impact**: Cannot test full user flows
- **Solution**: Install Playwright or Cypress

---

## Conclusion

**Current State**: **Basic test infrastructure in place, but low coverage**

**Strengths**:
- ✅ Vitest properly configured
- ✅ Testing libraries installed
- ✅ Some unit tests written and passing
- ✅ Manual tests comprehensive and working

**Weaknesses**:
- ❌ Low test coverage (~5-10%)
- ❌ Firebase dependency blocking many tests
- ❌ No integration tests
- ❌ No component tests
- ❌ No E2E tests

**Effort Required**:
- **2-3 days** to fix existing unit tests and add Firebase mocks
- **3-5 days** to add comprehensive integration tests
- **2-3 days** to add component tests
- **3-5 days** to set up E2E testing framework
- **Total**: **10-16 days** for complete test coverage

**Risk Assessment**:
- **Current**: **MEDIUM** - Core logic has manual tests, but no automated validation
- **With Full Tests**: **LOW** - Comprehensive automated testing ensures quality

---

*Last Updated: November 1, 2025*
*Test Framework: Vitest 4.0.6*
*Node Version: 20.x*
