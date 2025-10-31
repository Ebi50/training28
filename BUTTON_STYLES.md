# Design System & Style Guide

Diese Datei definiert alle Design-Standards für das gesamte Projekt.
Bei Änderungen hier können die Komponenten entsprechend angepasst werden.

---

## 🎨 Farbschema

### Primärfarben
- **Primary:** `#2176AE` (Blau) - Hauptfarbe für wichtige Elemente
- **Secondary:** `#57B8FF` (Hellblau) - Akzente und Highlights
- **Accent 1:** `#B6BD0D` (Olivgrün) - Fitness/CTL Metriken
- **Accent 2:** `#FBB13C` (Orange) - Warnungen, moderate Werte
- **Accent 3:** `#FE6847` (Koralle) - Errors, Logout-Button

### Tailwind Config Mapping
```javascript
colors: {
  primary: { light: '#2176AE', dark: '#57B8FF' },
  secondary: { light: '#57B8FF', dark: '#2176AE' },
  olive: { light: '#B6BD0D', dark: '#D4DC6B' },
  orange: { light: '#FBB13C', dark: '#FFC870' },
  coral: { light: '#FE6847', dark: '#FF8C6B' }
}
```

---

## 📏 Spacing & Sizing

### Button Padding
- **Standard:** `px-4 py-3` (horizontal: 16px, vertikal: 12px)
- **Kompakt:** `px-3 py-2` (nur für kleine Buttons)

### Icon Sizes
- **Sidebar Buttons:** `w-5 h-5` (20x20px)
- **User Avatar:** `w-12 h-12` (48x48px)
- **User Avatar Icon:** `w-7 h-7` (28x28px)

### Text Sizes
- **Buttons:** `text-base` (16px)
- **Headlines:** `text-2xl` (24px)
- **Body:** `text-base` (16px)
- **Secondary Text:** `text-sm` (14px)

### Border Radius
- **Standard:** `rounded-lg` (8px)
- **Avatars:** `rounded-full` (100%)
- **Cards:** `rounded-lg` (8px)

---

## 📐 Standard Button Classes

### Sidebar Navigation Buttons (Features, Wissenschaft, etc.)
```tsx
className="w-full flex items-center px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
```

**Eigenschaften:**
- `w-full` - volle Breite
- `flex items-center` - Flexbox mit vertikaler Zentrierung
- `px-4 py-3` - Padding horizontal 16px, vertikal 12px
- `text-base` - Schriftgröße 16px
- `hover:bg-white/15 dark:hover:bg-white/10` - Hover-Effekt
- `rounded-lg` - abgerundete Ecken
- `transition-all duration-200` - sanfte Übergänge

**Icon-Größe:** `w-5 h-5 mr-3` (20x20px, rechter Abstand 12px)

---

### Sidebar Action Buttons (Help, Dark Mode, Logout)
```tsx
className="w-full flex items-center px-4 py-3 text-base font-medium hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
```

**Zusätzlich:**
- `font-medium` - mittlere Schriftstärke

**Logout Button (mit Hintergrundfarbe):**
```tsx
className="w-full flex items-center px-4 py-3 text-base font-medium bg-coral dark:bg-coral-dark hover:bg-coral-700 dark:hover:bg-coral-800 rounded-lg transition-all duration-200 shadow-md"
```

---

### Buttons mit Umbruch (z.B. langer Text wie "Impressum & Datenschutz")
```tsx
className="w-full flex items-start px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
```

**Unterschied:**
- `items-start` statt `items-center` - für mehrzeiligen Text
- Icon: `w-5 h-5 mr-3 flex-shrink-0 mt-0.5` - Icon schrumpft nicht, leichter Versatz
- Text: `<span className="text-left">...</span>` - linksbündig

---

## 🎨 Icon-Größen

| Kontext | Größe | Tailwind Class |
|---------|-------|----------------|
| Sidebar Buttons | 20x20px | `w-5 h-5` |
| User Avatar | 48x48px | `w-12 h-12` |
| User Avatar Icon | 28x28px | `w-7 h-7` |

---

## 📝 Text-Größen

| Element | Größe | Tailwind Class |
|---------|-------|----------------|
| Button Text | 16px | `text-base` |
| Username | 16px | `text-base` |
| User Email | 14px | `text-sm` |

---

## 🔧 User Section

### User Avatar Container
```tsx
<div className="w-12 h-12 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center">
  <svg className="w-7 h-7 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Icon */}
  </svg>
</div>
```

### Username Display
```tsx
<p className="text-base font-medium truncate">
  {userEmail?.split('@')[0] || 'User'}
</p>
```

### Email Display
```tsx
<p className="text-sm opacity-70 truncate">
  {userEmail}
</p>
```

---

## ✅ Vollständiges Button-Beispiel

```tsx
<button
  onClick={() => router.push('/features#features')}
  className="w-full flex items-center px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
>
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
  </svg>
  <span>Button Text</span>
</button>
```

---

## 🎯 Wichtige Regeln

1. **Konsistenz:** Alle Sidebar-Buttons verwenden die gleichen Classes
2. **Icon-Abstand:** Immer `mr-3` (12px) zwischen Icon und Text
3. **Kein justify-center:** Nur `items-center` für normale Zentrierung
4. **Hover-States:** Immer Dark Mode Variante mitdenken
5. **Umbruch:** Bei langen Texten `items-start` statt `items-center`

---

## 🎯 Tooltips (Dashboard Metriken)

### Position & Layout
- **Position:** `left-full ml-4 top-0` (rechts neben der Box)
- **Breite:** `w-80` (320px)
- **Padding:** `p-4` (16px)
- **Z-Index:** `z-50` (über allem)

### Tooltip Container
```tsx
<div className="absolute z-50 w-80 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-2xl left-full ml-4 top-0">
```

### Tooltip Arrow (zeigt nach links)
```tsx
<div className="absolute right-full top-4">
  <div className="border-8 border-transparent border-r-surface-light dark:border-r-surface-dark"></div>
</div>
```

### Tooltip Content
- **Titel:** `text-lg font-semibold` (18px, fett)
- **Items:** `text-base` (16px) mit Bullet-Points
- **Item-Abstand:** `space-y-2` (8px vertikal)

### Tooltip Item Structure
```tsx
<ul className="space-y-2">
  <li className="flex items-start text-base text-text-primary-light dark:text-text-primary-dark">
    <span className="text-primary-light dark:text-primary-dark mr-2 mt-1 flex-shrink-0">•</span>
    <span>Erklärungstext hier</span>
  </li>
</ul>
```

---

## 🔄 CSS-Fehler Vermeidung

### Hover States richtig schreiben
❌ **Falsch:**
```css
hover:text-text-primary-light dark:text-text-primary-dark
```

✅ **Richtig:**
```css
hover:text-text-primary-light dark:hover:text-text-primary-dark
```

**Regel:** Dark Mode Hover braucht `dark:hover:` prefix!

### Doppelte Properties vermeiden
❌ **Falsch:**
```css
border-border-light dark:border-border-dark hover:border-border-light dark:border-border-dark
```

✅ **Richtig:**
```css
border-border-light dark:border-border-dark hover:border-primary-light dark:hover:border-primary-dark
```

---

## 📱 Component-Spezifische Styles

### Dashboard Layout
- **Sidebar Breite:** `w-64` (256px)
- **Sidebar Hintergrund:** Gradient von primary über secondary zu coral
- **Main Content Offset:** `ml-64` (links Platz für Sidebar)

### Metric Cards (CTL, ATL, TSB)
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-help transition-transform hover:scale-105">
```

### Training Plan Cards
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
```

---

## 🎨 Dark Mode Regeln

### Backgrounds
- **Light Mode:** `bg-surface-light` / `bg-white`
- **Dark Mode:** `bg-surface-dark` / `bg-gray-800`

### Text Colors
- **Primary Text:** `text-text-primary-light dark:text-text-primary-dark`
- **Secondary Text:** `text-text-secondary-light dark:text-text-secondary-dark`

### Borders
- **Standard:** `border-border-light dark:border-border-dark`
- **Hover:** `hover:border-primary-light dark:hover:border-primary-dark`

---

## 📋 Standard Page Layout (FÜR ALLE SEITEN)

### Wrapper Container (direkt nach DashboardLayout)
```tsx
<div className="max-w-7xl mx-auto">
  {/* Seiteninhalt */}
</div>
```

**Wichtig:**
- ❌ **KEIN** eigenes Padding (`px-`, `py-`, `p-`)
- ❌ **KEIN** eigener Background (`bg-white`, `bg-surface`, etc.)
- ✅ Nur `max-w-7xl mx-auto` für maximale Breite und Zentrierung
- ✅ DashboardLayout steuert ALLES (Padding, Background, etc.)

### Content Cards
```tsx
<div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow p-6">
  {/* Card-Inhalt */}
</div>
```

### Text Styling (ohne prose)
- **Headlines:** `text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4`
- **Subheadlines:** `text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mt-6 mb-3`
- **Body Text:** `text-base text-text-primary-light dark:text-text-primary-dark`
- **Links:** `text-primary-light dark:text-primary-dark hover:underline`

---

## 🔧 Datei-Zuordnung

Diese Design-Standards werden verwendet in:

| Datei | Komponenten |
|-------|-------------|
| `src/components/DashboardLayout.tsx` | Sidebar, Navigation, User Section |
| `src/components/Tooltip.tsx` | Tooltips für Metriken |
| `src/app/dashboard/page.tsx` | Dashboard Metrikkarten |
| `src/app/impressum/page.tsx` | Impressum & Datenschutz |
| `src/app/settings/page.tsx` | Einstellungen |
| `tailwind.config.js` | Farben, Themes |

---

## 🚀 Anleitung für Änderungen

### Schritt 1: Design-Standard hier ändern
Beispiel: Button-Padding von `py-3` auf `py-4` ändern

### Schritt 2: Betroffene Dateien identifizieren
Siehe "Datei-Zuordnung" Tabelle oben

### Schritt 3: Suchen & Ersetzen
```bash
# Beispiel: Alle Buttons mit neuem Padding
px-4 py-3  →  px-4 py-4
```

### Schritt 4: Testen
- Dev-Server starten: `npm run dev`
- Visuelle Prüfung aller betroffenen Komponenten
- Dark Mode testen
- Responsive Design prüfen

---

## ✅ Checkliste für neue Buttons

- [ ] `w-full` für volle Breite
- [ ] `flex items-center` (oder `items-start` bei Umbruch)
- [ ] `px-4 py-3` für konsistentes Padding
- [ ] `text-base` für Schriftgröße 16px
- [ ] Hover-States mit `dark:hover:` für Dark Mode
- [ ] `rounded-lg` für abgerundete Ecken
- [ ] `transition-all duration-200` für sanfte Übergänge
- [ ] Icons: `w-5 h-5 mr-3`
- [ ] Bei langem Text: `items-start` + `flex-shrink-0` am Icon

---

**Letzte Aktualisierung:** 31.10.2025
**Status:** ✅ Produktiv im Einsatz
**Maintainer:** GitHub Copilot
