# Design System - Migration Guide

## ✅ Was wurde erreicht

Das **zentrale Design System** ist erstellt (`src/styles/designSystem.ts`) mit:
- **Spacing** (Abstände: page, section, card, content, tight, micro)
- **Typography** (Schriftgrößen: h1, h2, h3, body, label, caption)
- **Colors** (Farben: bg, text, border, status, primary)
- **Components** (Buttons, Inputs, Labels, Cards, Badges, Grid)
- **Layout** (Container, Flex, Common Patterns)
- **Animation** (Transition Zeiten)

## 📝 Verwendung

### 1. Import in jeder Datei

```typescript
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
```

### 2. Komponenten ersetzen

#### Vorher (inkonsistent):
```tsx
<div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
    <h2 className="text-xl font-semibold">Titel</h2>
    <button className="px-4 py-2 bg-red-600 text-white rounded-md">
      Speichern
    </button>
  </div>
</div>
```

#### Nachher (konsistent mit Design System):
```tsx
<div className={spacing.section}>
  <div className={components.card.base}>
    <h2 className={typography.h2}>Titel</h2>
    <button className={components.button.primary}>
      Speichern
    </button>
  </div>
</div>
```

## 🎨 Beispiele

### Buttons

```tsx
// Primary Button
<button className={components.button.primary}>
  Speichern
</button>

// Secondary Button
<button className={components.button.secondary}>
  Abbrechen
</button>

// Small Button
<button className={components.button.small}>
  Klein
</button>

// Danger Button
<button className={components.button.danger}>
  Löschen
</button>
```

### Input Fields

```tsx
// Standard Input
<label className={components.label.default}>Name</label>
<input 
  type="text"
  className={components.input.base}
  placeholder="Ihr Name"
/>

// Small Input
<input 
  type="text"
  className={components.input.small}
/>

// Input mit Fehler
<input 
  type="text"
  className={components.input.error}
/>
```

### Cards

```tsx
// Standard Card
<div className={components.card.base}>
  <h3 className={typography.h3}>Titel</h3>
  <p className={typography.body}>Content</p>
</div>

// Hoverable Card
<div className={components.card.hover}>
  <h3 className={typography.h3}>Klickbar</h3>
</div>

// Elevated Card
<div className={components.card.elevated}>
  <h3 className={typography.h3}>Mit Schatten</h3>
</div>
```

### Grids

```tsx
// 2 Spalten Grid
<div className={components.grid.cols2}>
  <div>Spalte 1</div>
  <div>Spalte 2</div>
</div>

// 3 Spalten Grid
<div className={components.grid.cols3}>
  <div>Spalte 1</div>
  <div>Spalte 2</div>
  <div>Spalte 3</div>
</div>

// 4 Spalten Grid
<div className={components.grid.cols4}>
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</div>
```

### Badges/Status

```tsx
<span className={components.badge.success}>Erfolg</span>
<span className={components.badge.warning}>Warnung</span>
<span className={components.badge.error}>Fehler</span>
<span className={components.badge.info}>Info</span>
```

### Typography

```tsx
<h1 className={typography.h1}>Hauptüberschrift</h1>
<h2 className={typography.h2}>Sektion</h2>
<h3 className={typography.h3}>Unterüberschrift</h3>

<p className={typography.body}>Standard Text</p>
<p className={typography.bodyLarge}>Großer Text</p>
<p className={typography.bodySmall}>Kleiner Text</p>

<label className={typography.label}>Form Label</label>
<span className={typography.caption}>Caption Text</span>
```

### Spacing

```tsx
// Seitenlayout
<div className={spacing.page}>
  {/* 16px padding um die ganze Seite */}
</div>

// Sektionen trennen
<div className={spacing.section}>
  {/* 16px Abstand zwischen großen Blöcken */}
</div>

// Card Content
<div className={spacing.card}>
  {/* 16px padding innerhalb einer Card */}
</div>

// Content Blocks
<div className={spacing.contentBlock}>
  {/* 12px zwischen Content-Elementen */}
</div>

// Tight Spacing
<div className={spacing.tight}>
  {/* 8px für eng zusammenstehende Elemente */}
</div>
```

### Layout Helpers

```tsx
// Flex Row mit Items Center
<div className={layout.flexRow}>
  <span>Icon</span>
  <span>Text</span>
</div>

// Flex Row mit Space Between
<div className={layout.flexRowBetween}>
  <span>Links</span>
  <span>Rechts</span>
</div>

// Flex Column
<div className={layout.flexCol}>
  <div>Oben</div>
  <div>Unten</div>
</div>

// Container (max-width centered)
<div className={layout.container}>
  {/* Content zentriert mit max-width */}
</div>
```

## 📋 Migration Checklist

### ✅ Bereits migriert:
- [x] `src/styles/designSystem.ts` - Erstellt
- [x] `src/components/DashboardLayout.tsx` - Header & Main mit Design System
- [x] `src/app/settings/page.tsx` - Teilweise migriert (Profile Section)

### 🚧 Noch zu migrieren:
- [ ] `src/app/dashboard/page.tsx` - Main Dashboard
- [ ] `src/app/dashboard/plan/page.tsx` - Training Plan
- [ ] `src/app/dashboard/activities/page.tsx` - Activities
- [ ] `src/app/settings/page.tsx` - Restliche Sections (Time Slots, etc.)

## 🔄 Migration Pattern

Für jede Seite/Komponente:

1. **Import hinzufügen:**
   ```tsx
   import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
   ```

2. **Spacing ersetzen:**
   - `space-y-6` → `spacing.section`
   - `gap-4` → `spacing.cardGap`
   - `p-6` → `spacing.card`
   - `mb-4` → Individual durch `spacing.contentBlock` ersetzen

3. **Typography ersetzen:**
   - `text-2xl font-bold` → `typography.h1`
   - `text-xl font-semibold` → `typography.h2`
   - `text-base` → `typography.body`
   - `text-sm font-medium` → `typography.label`

4. **Components ersetzen:**
   - Buttons → `components.button.primary/secondary/small/danger`
   - Inputs → `components.input.base/small/error`
   - Cards → `components.card.base/hover/elevated`
   - Labels → `components.label.default/required`

5. **Colors ersetzen:**
   - `bg-white dark:bg-gray-800` → `colors.bg.card`
   - `text-text-primary-light dark:text-text-primary-dark` → `colors.text.primary`
   - `border-border-light dark:border-border-dark` → `colors.border.default`

## 🎯 Vorteile

### Vorher:
```tsx
<div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
      Titel
    </h2>
    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
      Speichern
    </button>
  </div>
</div>
```

### Nachher:
```tsx
<div className={spacing.section}>
  <div className={components.card.base}>
    <h2 className={`${typography.h2} mb-4`}>
      Titel
    </h2>
    <button className={components.button.primary}>
      Speichern
    </button>
  </div>
</div>
```

### Ergebnis:
- ✅ **50% weniger Code**
- ✅ **100% konsistent** - Alle Buttons sehen gleich aus
- ✅ **Einfach zu ändern** - Eine Zeile in designSystem.ts ändert ALLE Buttons
- ✅ **Lesbar** - Sofort klar was gemeint ist
- ✅ **Type-safe** - TypeScript warnt bei Tippfehlern

## 🚀 Nächste Schritte

1. **Test im Browser:**
   - Dev Server läuft bereits
   - Settings Page prüfen → Design System sollte sichtbar sein
   - Konsistenz prüfen

2. **Weitere Seiten migrieren:**
   - Dashboard → Alle Cards auf `components.card.base`
   - Plan → Alle Buttons auf `components.button.*`
   - Activities → Alle Inputs auf `components.input.base`

3. **Bei Bedarf erweitern:**
   - Neue Komponenten zu `designSystem.ts` hinzufügen
   - Z.B. `components.dropdown`, `components.modal`, etc.

## 💡 Pro-Tipps

1. **Kombinieren erlaubt:**
   ```tsx
   <button className={`${components.button.primary} w-full`}>
     Full Width Button
   </button>
   ```

2. **Custom Overrides möglich:**
   ```tsx
   <button className={`${components.button.primary} text-lg py-3`}>
     Größerer Button (überschreibt padding)
   </button>
   ```

3. **Responsive bleibt erhalten:**
   ```tsx
   <div className={`${components.grid.cols3} gap-8 md:gap-12`}>
     {/* Grid mit custom gap für größere Screens */}
   </div>
   ```

## 📞 Support

Bei Fragen oder Unklarheiten:
- Schauen Sie in `src/styles/designSystem.ts` - Alle Definitionen sind dort
- Jede Definition hat Kommentare mit Größenangaben
- Beispiele in dieser Datei zeigen alle Use Cases

**Happy Coding! 🎉**
