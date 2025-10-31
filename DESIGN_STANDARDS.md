# Design Standards - Adaptive Training System

## Farbschema

### Primärfarben
- **Primary Blue**: `#2176AE` (light) / `#4A90B8` (dark)
- **Secondary Light Blue**: `#57B8FF` (light) / `#4A9DD6` (dark)
- **Olive Green**: `#B6BD0D` (light) / `#97A320` (dark)
- **Orange**: `#FBB13C` (light) / `#D9983A` (dark)
- **Coral**: `#FE6847` (light) / `#D9624D` (dark)

### Verwendung
- **Primary**: Hauptaktionen, wichtige Buttons, aktive Navigationselemente
- **Secondary**: Informations-Hervorhebungen, sekundäre Aktionen
- **Olive**: Ausdauer-Training, LIT-Sessions
- **Orange**: Sync/Update-Aktionen, mittlere Intensität
- **Coral**: Verbindungen (Strava), HIT-Sessions, hohe Intensität

### ❌ NICHT verwenden
- Grün für Buttons oder UI-Elemente (nur für Status-Meldungen "erfolgreich")
- Standard Tailwind-Farben ohne Dark Mode Varianten

## Typografie

### Schriftgrößen (größer für bessere Lesbarkeit)
- **Seitenüberschrift (h1)**: `text-3xl font-bold` (min 30px)
- **Section-Überschrift (h2)**: `text-2xl font-semibold` (min 24px)
- **Subsection-Überschrift (h3)**: `text-xl font-semibold` (min 20px)
- **Body Text**: `text-base` (16px) mit `leading-relaxed`
- **Kleine Texte**: `text-sm` (14px) - nur für Metadaten
- **Winzige Texte**: `text-xs` (12px) - VERMEIDEN, nur für Timestamps

### Labels und Inputs
- **Label**: `text-base font-medium` (nicht kleiner als 16px)
- **Input Text**: `text-base` mit hellem Hintergrund im Dark Mode
- **Placeholder**: `text-gray-500 dark:text-gray-400`

## Layout

### Container Width
- **Standard**: `max-w-7xl mx-auto` (1280px max)
- **Schmaler Content** (Artikel): `max-w-4xl mx-auto` (1024px max)
- **Padding**: `px-8 py-8` (Standard), `px-6 py-6` (Cards)

### Spacing
- **Section-Abstand**: `space-y-6` oder `space-y-8`
- **Element-Abstand**: `gap-4` bis `gap-6`
- **Card Padding**: `p-6` bis `p-8`

## Komponenten

### Buttons
```tsx
// Primary Action
className="px-6 py-3 bg-primary dark:bg-primary-dark text-white text-base font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"

// Secondary Action (Orange)
className="px-6 py-3 bg-orange dark:bg-orange-dark text-white text-base font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"

// Danger/Important (Coral)
className="px-6 py-3 bg-coral dark:bg-coral-dark text-white text-base font-medium rounded-lg hover:bg-coral-700 dark:hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 transition-all"
```

### Cards
```tsx
className="bg-surface-light dark:bg-surface-dark rounded-lg shadow border border-border-light dark:border-border-dark"

// Header
className="px-6 py-5 border-b border-border-light dark:border-border-dark"

// Body
className="p-8"
```

### Input Fields
```tsx
// Automatisch durch globals.css gestylt
// Aber explizit:
className="w-full px-4 py-2.5 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary dark:focus:border-primary-dark"
```

### Labels
```tsx
className="block text-base font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
```

## Dark Mode

### Input-Felder
- **Hintergrund**: Dunkel (`bg-gray-800`)
- **Text**: Hell (`text-gray-100`)
- **Border**: Sichtbar (`border-border-dark`)

### Text-Kontraste
- **Primary Text**: Fast schwarz / Fast weiß
- **Secondary Text**: Medium Grau (lesbar!)
- **Disabled Text**: Hell Grau

## Grid-Layouts

### Strava Integration (Referenz)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2">
    {/* Info nimmt 2/3 */}
  </div>
  <div className="lg:col-span-1">
    {/* Actions nimmt 1/3 */}
  </div>
</div>
```

### Zwei-Spalten Form
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>
```

## Beispiel-Implementierung

Siehe `src/app/settings/page.tsx` als Referenz für:
- ✅ Richtige Schriftgrößen
- ✅ Farbschema-konforme Buttons
- ✅ Dark Mode Input-Felder
- ✅ Breites Layout (max-w-7xl)
- ✅ Gute Abstände und Lesbarkeit

## Checkliste für neue Seiten

- [ ] `max-w-7xl` Container verwendet
- [ ] Keine grünen Buttons (nur Primary/Orange/Coral)
- [ ] Mindestens `text-base` für Body-Text
- [ ] Labels mindestens `text-base`
- [ ] Input-Felder mit dunklem Hintergrund im Dark Mode
- [ ] `px-8 py-8` Padding für Content
- [ ] `leading-relaxed` für Fließtext
- [ ] Alle Farben haben Dark Mode Varianten
- [ ] Buttons haben `transition-all` für smooth Hover
