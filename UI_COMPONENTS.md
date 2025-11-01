# Cyclona - UI Components Specification

**Version**: 1.0  
**Datum**: 2025-11-01  
**Status**: ✅ READY FOR IMPLEMENTATION  

---

## Übersicht

Dieses Dokument spezifiziert alle React-Komponenten für Cyclona MVP, organisiert nach:
1. **Layout Components** (Navigation, Wrapper)
2. **Dashboard Components** (Today's Workout, Fitness Chart, Goals)
3. **Setup Flow Components** (FTP Input, Slot Editor, Event Picker)
4. **Settings Components** (Profile Editor, Integrations)
5. **Shared Components** (Buttons, Inputs, Modals)

**Design System**: Tailwind CSS + Custom Design Tokens (siehe DESIGN_SYSTEM_MASTER.md)

---

## 1. Layout Components

### 1.1 `DashboardLayout`

**Purpose**: Main layout wrapper mit Navigation + Header

**File**: `src/components/DashboardLayout.tsx`

**Props**:
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}
```

**Structure**:
```tsx
<div className="min-h-screen bg-gray-50">
  <Header />
  <Sidebar />
  <main className="ml-64 pt-16 px-8 py-6">
    {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
    {children}
  </main>
</div>
```

**Features**:
- Sticky header (z-index: 50)
- Collapsible sidebar (mobile)
- Breadcrumbs (optional)
- Responsive (mobile: full-width, no sidebar)

---

### 1.2 `Header`

**Purpose**: Top navigation bar

**File**: `src/components/Header.tsx`

**Props**: None (uses `useAuth` hook)

**Structure**:
```tsx
<header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
  <div className="flex items-center justify-between px-6 h-full">
    <CyclonaLogo />
    <nav className="hidden md:flex space-x-6">
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/settings">Settings</NavLink>
    </nav>
    <UserMenu />
  </div>
</header>
```

**Features**:
- Logo (click → /dashboard)
- Navigation links
- User avatar + dropdown menu
- Mobile hamburger menu

---

### 1.3 `Sidebar`

**Purpose**: Left sidebar navigation (desktop only)

**File**: `src/components/Sidebar.tsx`

**Props**: None

**Structure**:
```tsx
<aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r">
  <nav className="p-4 space-y-2">
    <SidebarLink icon={<HomeIcon />} href="/dashboard" active={pathname === '/dashboard'}>
      Dashboard
    </SidebarLink>
    <SidebarLink icon={<CalendarIcon />} href="/calendar">
      Calendar
    </SidebarLink>
    <SidebarLink icon={<ChartIcon />} href="/analytics">
      Analytics
    </SidebarLink>
    <SidebarLink icon={<SettingsIcon />} href="/settings">
      Settings
    </SidebarLink>
  </nav>
</aside>
```

**Features**:
- Active state highlighting
- Icons (Heroicons)
- Scroll on overflow
- Hidden on mobile

---

## 2. Dashboard Components

### 2.1 `TodayWorkoutCard`

**Purpose**: Display today's planned workout with actions

**File**: `src/components/TodayWorkoutCard.tsx`

**Props**:
```typescript
interface TodayWorkoutCardProps {
  plan: DailyPlan | null;
  loading?: boolean;
  onStartWorkout: () => void;
  onViewDetails: () => void;
}
```

**Structure**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {loading ? (
    <Skeleton />
  ) : plan ? (
    <>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{plan.workout_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>{plan.planned_duration_min} min</span>
            <span>·</span>
            <span>TSS {plan.planned_tss}</span>
            <span>·</span>
            <Badge color={phaseColor}>{plan.phase}</Badge>
          </div>
        </div>
        {plan.adjustment_applied && (
          <Tooltip content={plan.adjustment_applied.reason}>
            <Badge color="amber">Adjusted</Badge>
          </Tooltip>
        )}
      </div>
      
      <WorkoutPreview structure={plan.workout_structure} />
      
      <div className="flex gap-3 mt-6">
        <Button variant="primary" size="lg" onClick={onStartWorkout}>
          Download ZWO
        </Button>
        <Button variant="outline" size="lg" onClick={onViewDetails}>
          View Details
        </Button>
      </div>
    </>
  ) : (
    <EmptyState 
      icon={<CalendarIcon />}
      title="No workout planned"
      description="Your rest day or no plan available yet."
    />
  )}
</div>
```

**States**:
- Loading (skeleton)
- Plan exists (full display)
- No plan (empty state)
- Adjustment badge (if TSB-adjusted)

**Interactions**:
- "Download ZWO" → Generate + download ZWO file
- "View Details" → Open WorkoutDetailsModal

---

### 2.2 `WorkoutPreview`

**Purpose**: Visual preview of workout structure (warmup, intervals, cooldown)

**File**: `src/components/WorkoutPreview.tsx`

**Props**:
```typescript
interface WorkoutPreviewProps {
  structure: WorkoutSegment[];
  compact?: boolean;  // Compact view (no labels)
}
```

**Structure**:
```tsx
<div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
  {structure.map((segment, idx) => (
    <div
      key={idx}
      className={cn(
        "absolute h-full transition-all",
        segmentColor(segment.type)
      )}
      style={{
        left: `${calculateOffset(segment)}%`,
        width: `${calculateWidth(segment)}%`,
      }}
    >
      {!compact && (
        <span className="text-xs font-medium">{segment.type}</span>
      )}
    </div>
  ))}
</div>
```

**Features**:
- Color-coded segments:
  - Warmup: gray
  - Intervals (high): red
  - Intervals (low): yellow
  - Steady: blue
  - Cooldown: gray
- Proportional widths (by duration)
- Hover tooltips (intensity + duration)

---

### 2.3 `FitnessCurveChart`

**Purpose**: Display CTL/ATL/TSB over time

**File**: `src/components/FitnessCurveChart.tsx`

**Props**:
```typescript
interface FitnessCurveChartProps {
  data: DailyMetrics[];       // Last 28 days
  loading?: boolean;
  highlightToday?: boolean;
}
```

**Structure**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold mb-4">Fitness Trend</h3>
  
  {loading ? (
    <Skeleton height={300} />
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={formatDate} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        <Line 
          type="monotone" 
          dataKey="ctl" 
          stroke="#3B82F6" 
          name="CTL (Fitness)" 
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="atl" 
          stroke="#EC4899" 
          name="ATL (Fatigue)" 
          strokeWidth={2}
        />
        <Bar 
          dataKey="tsb" 
          fill="#9CA3AF" 
          name="TSB (Form)"
          opacity={0.6}
        />
      </LineChart>
    </ResponsiveContainer>
  )}
  
  <div className="flex items-center justify-between mt-4 text-sm">
    <div>
      <span className="font-semibold">CTL:</span> {latestCTL}
    </div>
    <div>
      <span className="font-semibold">ATL:</span> {latestATL}
    </div>
    <div>
      <span className="font-semibold">TSB:</span> 
      <span className={cn(
        latestTSB > 5 ? "text-green-600" : latestTSB < -15 ? "text-red-600" : "text-gray-600"
      )}>
        {latestTSB > 0 ? '+' : ''}{latestTSB}
      </span>
    </div>
  </div>
</div>
```

**Library**: Recharts

**Features**:
- CTL (blue line)
- ATL (pink line)
- TSB (gray bars)
- Hover tooltips with exact values
- Today highlighted (vertical line)
- Responsive (mobile: smaller height)

---

### 2.4 `NextGoalCard`

**Purpose**: Display upcoming event with progress

**File**: `src/components/NextGoalCard.tsx`

**Props**:
```typescript
interface NextGoalCardProps {
  event: Event | null;
  currentCTL: number;
  loading?: boolean;
}
```

**Structure**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {loading ? (
    <Skeleton />
  ) : event ? (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <FlagIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{event.name}</h3>
          <p className="text-sm text-gray-600">{event.type}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Date</span>
          <span className="font-medium">{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Countdown</span>
          <span className="font-medium text-blue-600">
            {calculateWeeksUntil(event.date)} weeks
          </span>
        </div>
      </div>
      
      {event.target_ctl && (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">CTL Progress</span>
              <span className="font-medium">
                {currentCTL} / {event.target_ctl}
              </span>
            </div>
            <ProgressBar 
              value={currentCTL} 
              max={event.target_ctl} 
              color="blue"
            />
          </div>
          <p className="text-xs text-gray-500">
            {event.target_ctl - currentCTL > 0 
              ? `${event.target_ctl - currentCTL} points to go` 
              : 'Target reached! 🎉'}
          </p>
        </>
      )}
    </>
  ) : (
    <EmptyState 
      icon={<FlagIcon />}
      title="No upcoming events"
      description="Add an event in settings to track your progress."
      action={<Button href="/settings">Add Event</Button>}
    />
  )}
</div>
```

**Features**:
- Event icon + name + type
- Countdown (weeks until event)
- CTL progress bar (if target set)
- Empty state with CTA

---

## 3. Setup Flow Components

### 3.1 `SetupWizard`

**Purpose**: Multi-step setup flow container

**File**: `src/app/setup/page.tsx` (Page component with embedded logic)

**State**:
```typescript
interface SetupState {
  currentStep: number;
  ftp: number | null;
  weight_kg: number | null;
  max_hr: number | null;
  slots: TimeSlot[];
  events: Event[];
}
```

**Structure**:
```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
    <StepIndicator currentStep={currentStep} totalSteps={4} />
    
    {currentStep === 1 && (
      <FTPInputStep 
        value={state.ftp} 
        onChange={(ftp) => setState({...state, ftp})} 
      />
    )}
    {currentStep === 2 && (
      <SlotEditorStep 
        slots={state.slots} 
        onChange={(slots) => setState({...state, slots})} 
      />
    )}
    {currentStep === 3 && (
      <EventInputStep 
        events={state.events} 
        onChange={(events) => setState({...state, events})} 
      />
    )}
    {currentStep === 4 && (
      <SummaryStep state={state} />
    )}
    
    <div className="flex justify-between mt-8">
      {currentStep > 1 && (
        <Button variant="outline" onClick={handlePrevious}>
          Back
        </Button>
      )}
      <Button 
        variant="primary" 
        onClick={currentStep < 4 ? handleNext : handleSubmit}
        disabled={!isStepValid(currentStep)}
      >
        {currentStep < 4 ? 'Next' : 'Complete Setup'}
      </Button>
    </div>
  </div>
</div>
```

**Flow**:
1. Step 1: FTP + Weight + Max HR
2. Step 2: Time Slots
3. Step 3: Event (optional)
4. Step 4: Summary + Confirmation

---

### 3.2 `FTPInputStep`

**Purpose**: Input FTP or estimate from test

**File**: `src/components/setup/FTPInputStep.tsx`

**Props**:
```typescript
interface FTPInputStepProps {
  value: number | null;
  onChange: (ftp: number) => void;
}
```

**Structure**:
```tsx
<div>
  <h2 className="text-2xl font-bold mb-4">What's your FTP?</h2>
  <p className="text-gray-600 mb-6">
    Your Functional Threshold Power is used to calculate training zones.
  </p>
  
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium mb-2">
        I know my FTP
      </label>
      <Input 
        type="number" 
        value={value || ''} 
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="250"
        suffix="watts"
      />
    </div>
    
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">OR</span>
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2">
        Estimate from recent ride
      </label>
      <Select 
        options={recentActivities} 
        onChange={handleEstimate}
        placeholder="Select a ride..."
      />
      <p className="text-xs text-gray-500 mt-1">
        We'll estimate your FTP from your best 20-min power × 0.95
      </p>
    </div>
  </div>
  
  <Alert type="info" className="mt-6">
    Not sure? Start with 200W and adjust after your first test.
  </Alert>
</div>
```

**Features**:
- Manual input (primary)
- Estimate from Strava activity (if connected)
- Validation (100-500W reasonable range)
- Help text + tooltips

---

### 3.3 `SlotEditorStep`

**Purpose**: Define weekly time slots

**File**: `src/components/setup/SlotEditorStep.tsx`

**Props**:
```typescript
interface SlotEditorStepProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}
```

**Structure**:
```tsx
<div>
  <h2 className="text-2xl font-bold mb-4">When can you train?</h2>
  <p className="text-gray-600 mb-6">
    Define your available time windows. We'll plan workouts to fit.
  </p>
  
  <div className="space-y-4">
    {slots.map((slot, idx) => (
      <SlotEditorRow 
        key={slot.id}
        slot={slot}
        onChange={(updated) => handleSlotUpdate(idx, updated)}
        onDelete={() => handleSlotDelete(idx)}
      />
    ))}
  </div>
  
  <Button 
    variant="outline" 
    onClick={handleAddSlot}
    className="mt-4 w-full"
  >
    + Add Time Slot
  </Button>
  
  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
    <p className="text-sm font-medium text-blue-900 mb-2">
      Total available time: {calculateTotalTime(slots)} hours/week
    </p>
    <p className="text-xs text-blue-700">
      We recommend 6-12 hours/week for optimal training.
    </p>
  </div>
</div>
```

**Features**:
- Add/Remove slots dynamically
- Per-slot: Day, Start Time (optional), Max Duration
- Total time calculation
- Validation (at least 1 slot, max 14 slots)

---

### 3.4 `SlotEditorRow`

**Purpose**: Single time slot editor

**File**: `src/components/SlotEditorRow.tsx`

**Props**:
```typescript
interface SlotEditorRowProps {
  slot: TimeSlot;
  onChange: (slot: TimeSlot) => void;
  onDelete: () => void;
}
```

**Structure**:
```tsx
<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
  <Select 
    value={slot.day_of_week}
    onChange={(day) => onChange({...slot, day_of_week: day})}
    options={[
      { value: 1, label: 'Monday' },
      { value: 2, label: 'Tuesday' },
      // ... all days
    ]}
  />
  
  <Input 
    type="time"
    value={slot.start_time || ''}
    onChange={(e) => onChange({...slot, start_time: e.target.value})}
    placeholder="Optional"
  />
  
  <Input 
    type="number"
    value={slot.duration_max}
    onChange={(e) => onChange({...slot, duration_max: Number(e.target.value)})}
    suffix="min"
    min={30}
    max={240}
  />
  
  <IconButton 
    icon={<TrashIcon />} 
    onClick={onDelete}
    variant="ghost"
    color="red"
  />
</div>
```

**Validation**:
- Duration: 30-240 minutes
- Start time: Optional but recommended
- Day: Required, no duplicates allowed (show warning if duplicate)

---

### 3.5 `EventInputStep`

**Purpose**: Add goal event (race, gran fondo, etc.)

**File**: `src/components/setup/EventInputStep.tsx`

**Props**:
```typescript
interface EventInputStepProps {
  events: Event[];
  onChange: (events: Event[]) => void;
}
```

**Structure**:
```tsx
<div>
  <h2 className="text-2xl font-bold mb-4">Do you have a goal event?</h2>
  <p className="text-gray-600 mb-6">
    Optional: Add your target race or event. We'll build your plan around it.
  </p>
  
  {events.length > 0 ? (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <EventCard 
          key={event.id}
          event={event}
          onEdit={() => handleEditEvent(idx)}
          onDelete={() => handleDeleteEvent(idx)}
        />
      ))}
    </div>
  ) : (
    <EmptyState 
      icon={<CalendarIcon />}
      title="No events yet"
      description="Training without a specific goal? No problem! You can add one later."
    />
  )}
  
  <Button 
    variant="outline" 
    onClick={handleAddEvent}
    className="mt-4 w-full"
  >
    + Add Event
  </Button>
  
  <Button 
    variant="link" 
    onClick={() => onChange([])}
    className="mt-2 w-full text-sm"
  >
    Skip this step
  </Button>
</div>
```

**Features**:
- Add multiple events (A/B/C goals)
- Event fields: Name, Date, Type, Priority
- Auto-calculate phase (BASE if >16 weeks away)

---

## 4. Settings Components

### 4.1 `ProfileSettings`

**Purpose**: Edit user profile (FTP, weight, etc.)

**File**: `src/components/settings/ProfileSettings.tsx`

**Props**:
```typescript
interface ProfileSettingsProps {
  profile: UserProfile;
  onSave: (profile: Partial<UserProfile>) => Promise<void>;
}
```

**Structure**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
  
  <Form onSubmit={handleSubmit}>
    <div className="grid grid-cols-2 gap-4">
      <Input 
        label="FTP (Watts)"
        type="number"
        value={ftp}
        onChange={setFtp}
      />
      <Input 
        label="Weight (kg)"
        type="number"
        value={weight}
        onChange={setWeight}
      />
      <Input 
        label="Max HR (bpm)"
        type="number"
        value={maxHR}
        onChange={setMaxHR}
      />
      <Select 
        label="Units"
        value={units}
        onChange={setUnits}
        options={[
          { value: 'METRIC', label: 'Metric (km, kg)' },
          { value: 'IMPERIAL', label: 'Imperial (mi, lb)' }
        ]}
      />
    </div>
    
    <div className="flex justify-end gap-3 mt-6">
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" loading={saving}>
        Save Changes
      </Button>
    </div>
  </Form>
</div>
```

---

### 4.2 `IntegrationsSettings`

**Purpose**: Connect Strava, Garmin, Whoop, etc.

**File**: `src/components/settings/IntegrationsSettings.tsx`

**Props**:
```typescript
interface IntegrationsSettingsProps {
  profile: UserProfile;
  onConnect: (service: string) => void;
  onDisconnect: (service: string) => void;
}
```

**Structure**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold mb-4">Integrations</h2>
  
  <div className="space-y-4">
    <IntegrationRow 
      name="Strava"
      description="Sync activities and performance data"
      icon={<StravaIcon />}
      connected={profile.strava_connected}
      onConnect={() => onConnect('strava')}
      onDisconnect={() => onDisconnect('strava')}
    />
    
    <IntegrationRow 
      name="Garmin Connect"
      description="Import HRV, sleep, and readiness data"
      icon={<GarminIcon />}
      connected={profile.garmin_connected}
      onConnect={() => onConnect('garmin')}
      onDisconnect={() => onDisconnect('garmin')}
      badge="Phase 2"
    />
    
    <IntegrationRow 
      name="Whoop"
      description="Import recovery and strain data"
      icon={<WhoopIcon />}
      connected={profile.whoop_connected}
      onConnect={() => onConnect('whoop')}
      onDisconnect={() => onDisconnect('whoop')}
      badge="Phase 2"
    />
  </div>
</div>
```

---

### 4.3 `IntegrationRow`

**Purpose**: Single integration with connect/disconnect action

**File**: `src/components/IntegrationRow.tsx`

**Props**:
```typescript
interface IntegrationRowProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  badge?: string;  // e.g. "Phase 2", "Coming Soon"
}
```

**Structure**:
```tsx
<div className="flex items-center justify-between p-4 border rounded-lg">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{name}</h3>
        {badge && <Badge color="gray" size="sm">{badge}</Badge>}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
  
  {connected ? (
    <div className="flex items-center gap-3">
      <Badge color="green">Connected</Badge>
      <Button variant="outline" size="sm" onClick={onDisconnect}>
        Disconnect
      </Button>
    </div>
  ) : (
    <Button variant="primary" size="sm" onClick={onConnect}>
      Connect
    </Button>
  )}
</div>
```

---

## 5. Shared Components

### 5.1 `Button`

**Purpose**: Primary action button

**File**: `src/components/Button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'red' | 'green' | 'gray';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  href?: string;  // If href provided, renders as Link
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Variants**:
```tsx
// Primary (default)
<Button variant="primary">Save</Button>
// → bg-blue-600 text-white hover:bg-blue-700

// Outline
<Button variant="outline">Cancel</Button>
// → border-gray-300 text-gray-700 hover:bg-gray-50

// Ghost
<Button variant="ghost">Edit</Button>
// → transparent hover:bg-gray-100

// Link
<Button variant="link">Learn more</Button>
// → text-blue-600 underline-offset-4 hover:underline
```

**Loading State**:
```tsx
<Button loading={isSubmitting}>
  {loading ? <Spinner /> : 'Submit'}
</Button>
```

---

### 5.2 `Input`

**Purpose**: Text/number input with label and validation

**File**: `src/components/Input.tsx`

**Props**:
```typescript
interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'time' | 'date';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  suffix?: string;  // e.g. "watts", "km"
  prefix?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
}
```

**Structure**:
```tsx
<div className="w-full">
  {label && (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
  )}
  
  <div className="relative">
    {prefix && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        {prefix}
      </span>
    )}
    
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      className={cn(
        "block w-full px-3 py-2 border rounded-lg",
        "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        error ? "border-red-500" : "border-gray-300",
        prefix && "pl-10",
        suffix && "pr-16"
      )}
    />
    
    {suffix && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        {suffix}
      </span>
    )}
  </div>
  
  {error && (
    <p className="text-sm text-red-600 mt-1">{error}</p>
  )}
  {helperText && !error && (
    <p className="text-sm text-gray-500 mt-1">{helperText}</p>
  )}
</div>
```

---

### 5.3 `Select`

**Purpose**: Dropdown selection

**File**: `src/components/Select.tsx`

**Props**:
```typescript
interface SelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}
```

**Structure**:
```tsx
<div className="w-full">
  {label && (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
  )}
  
  <select
    value={value as any}
    onChange={(e) => onChange(e.target.value as T)}
    disabled={disabled}
    className={cn(
      "block w-full px-3 py-2 border rounded-lg",
      "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      error ? "border-red-500" : "border-gray-300"
    )}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map(opt => (
      <option key={String(opt.value)} value={opt.value as any}>
        {opt.label}
      </option>
    ))}
  </select>
  
  {error && (
    <p className="text-sm text-red-600 mt-1">{error}</p>
  )}
</div>
```

---

### 5.4 `Badge`

**Purpose**: Small label/tag for status, category, etc.

**File**: `src/components/Badge.tsx`

**Props**:
```typescript
interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline';
}
```

**Variants**:
```tsx
<Badge color="blue">BUILD</Badge>
// → bg-blue-100 text-blue-800

<Badge color="green">Connected</Badge>
// → bg-green-100 text-green-800

<Badge color="red" variant="outline">Adjusted</Badge>
// → border-red-300 text-red-700
```

---

### 5.5 `Modal`

**Purpose**: Overlay modal dialog

**File**: `src/components/Modal.tsx`

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}
```

**Structure**:
```tsx
<Transition show={isOpen}>
  <Dialog onClose={onClose} className="relative z-50">
    {/* Backdrop */}
    <Transition.Child
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black/30" />
    </Transition.Child>
    
    {/* Modal */}
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Transition.Child
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Dialog.Panel className={cn(
          "bg-white rounded-lg shadow-xl max-w-md w-full",
          sizeClasses[size]
        )}>
          {title && (
            <Dialog.Title className="text-lg font-semibold px-6 pt-6">
              {title}
            </Dialog.Title>
          )}
          
          <div className="px-6 py-4">
            {children}
          </div>
          
          {footer && (
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              {footer}
            </div>
          )}
        </Dialog.Panel>
      </Transition.Child>
    </div>
  </Dialog>
</Transition>
```

**Usage Example**:
```tsx
<Modal 
  isOpen={showDetails} 
  onClose={() => setShowDetails(false)}
  title="Workout Details"
  size="lg"
  footer={
    <Button onClick={() => setShowDetails(false)}>Close</Button>
  }
>
  <WorkoutDetails workout={plan.workout} />
</Modal>
```

---

### 5.6 `Tooltip`

**Purpose**: Hover tooltip for help text

**File**: `src/components/Tooltip.tsx`

**Props**:
```typescript
interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
```

**Library**: Radix UI Tooltip or Headless UI

**Structure**:
```tsx
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      {children}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content
        className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg"
        sideOffset={5}
      >
        {content}
        <Tooltip.Arrow className="fill-gray-900" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

---

### 5.7 `EmptyState`

**Purpose**: Placeholder when no data

**File**: `src/components/EmptyState.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

**Structure**:
```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  {icon && (
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
  )}
  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
  {description && (
    <p className="text-sm text-gray-600 mb-4 max-w-sm">{description}</p>
  )}
  {action}
</div>
```

---

### 5.8 `Skeleton`

**Purpose**: Loading placeholder

**File**: `src/components/Skeleton.tsx`

**Props**:
```typescript
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;  // Multiple lines
}
```

**Structure**:
```tsx
<div className="animate-pulse">
  {Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={cn(
        "bg-gray-200",
        circle ? "rounded-full" : "rounded-lg",
        i > 0 && "mt-2"
      )}
      style={{ width, height }}
    />
  ))}
</div>
```

**Usage Example**:
```tsx
// Card loading
<div className="space-y-3">
  <Skeleton height={32} width="60%" />
  <Skeleton height={20} count={3} />
  <Skeleton height={40} width={120} />
</div>
```

---

## 6. Hooks

### 6.1 `useAuth`

**Purpose**: Access current user + auth state

**File**: `src/hooks/useAuth.ts`

**Return Type**:
```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Usage**:
```tsx
const { user, loading, signOut } = useAuth();

if (loading) return <Spinner />;
if (!user) return <Redirect to="/login" />;

return <Dashboard user={user} />;
```

---

### 6.2 `useDashboard`

**Purpose**: Fetch dashboard data (today's plan, metrics, event)

**File**: `src/hooks/useDashboard.ts`

**Return Type**:
```typescript
interface UseDashboardReturn {
  todayPlan: DailyPlan | null;
  metrics: DailyMetrics[];  // Last 28 days
  nextEvent: Event | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Implementation**:
```tsx
export function useDashboard() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: todayPlan, error: planError } = useSWR(
    user ? `/api/plans/${today}` : null,
    () => getDailyPlan(user!.uid, today),
    { refreshInterval: 300000 }  // 5 min
  );
  
  const { data: metrics, error: metricsError } = useSWR(
    user ? `/api/metrics/range` : null,
    () => getDailyMetricsRange(user!.uid, last28Days(), today),
    { refreshInterval: 600000 }  // 10 min
  );
  
  // ... similar for nextEvent
  
  return { todayPlan, metrics, nextEvent, loading, error, refetch };
}
```

---

### 6.3 `useWorkoutDownload`

**Purpose**: Generate + download ZWO file

**File**: `src/hooks/useWorkoutDownload.ts`

**Return Type**:
```typescript
interface UseWorkoutDownloadReturn {
  downloadZWO: (workout: Workout, ftp: number) => void;
  loading: boolean;
  error: Error | null;
}
```

**Implementation**:
```tsx
export function useWorkoutDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const downloadZWO = useCallback((workout: Workout, ftp: number) => {
    try {
      setLoading(true);
      
      // Generate ZWO
      const zwoXML = generateZWO(workout, ftp);
      
      // Create Blob
      const blob = new Blob([zwoXML], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${format(new Date(), 'yyyy-MM-dd')}_${workout.name.replace(/\s/g, '_')}.zwo`;
      a.click();
      
      URL.revokeObjectURL(url);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);
  
  return { downloadZWO, loading, error };
}
```

---

## 7. Responsive Design

### Breakpoints (Tailwind)

```
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Desktops
xl: 1280px  // Large desktops
2xl: 1536px // Extra large
```

### Component Responsiveness

#### Dashboard (Desktop)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <TodayWorkoutCard />       {/* Full width on mobile, 50% on desktop */}
  <div className="space-y-6">
    <FitnessCurveChart />
    <NextGoalCard />
  </div>
</div>
```

#### Dashboard (Mobile)
```tsx
<div className="space-y-6">
  <TodayWorkoutCard />
  <FitnessCurveChart />
  <NextGoalCard />
</div>
```

---

## 8. Accessibility

### ARIA Labels
```tsx
<button aria-label="Download workout">
  <DownloadIcon />
</button>
```

### Keyboard Navigation
- All interactive elements: Tab-navigable
- Modals: Focus trap + Escape to close
- Forms: Enter to submit

### Screen Reader Support
- Semantic HTML (`<header>`, `<nav>`, `<main>`)
- Alt text for images/icons
- ARIA roles where needed

---

## Zusammenfassung

**Total Components**: 25+
- Layout: 3 (DashboardLayout, Header, Sidebar)
- Dashboard: 4 (TodayWorkoutCard, WorkoutPreview, FitnessCurveChart, NextGoalCard)
- Setup: 5 (SetupWizard, FTPInputStep, SlotEditorStep, SlotEditorRow, EventInputStep)
- Settings: 3 (ProfileSettings, IntegrationsSettings, IntegrationRow)
- Shared: 8 (Button, Input, Select, Badge, Modal, Tooltip, EmptyState, Skeleton)
- Hooks: 3 (useAuth, useDashboard, useWorkoutDownload)

**Design System**: Tailwind CSS + Custom Colors/Spacing  
**Icons**: Heroicons  
**Charts**: Recharts  
**Modals**: Headless UI / Radix UI  

🚀 **READY TO BUILD!**
