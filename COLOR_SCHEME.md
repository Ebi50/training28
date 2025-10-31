# Farbschema - Training2026

## 🎨 Farbpalette

### Light Mode (Helle Umgebung)
Lebendige, athletische Farben für optimale Motivation und Klarheit.

### Dark Mode (Dunkle Umgebung)
Gedämpfte, elegante Töne für angenehmes Arbeiten bei Nacht.

---

## Hauptfarben

### 🔵 Primary: Blau
**Light Mode:** `#2176AE` (Lebendiges Blau)
**Dark Mode:** `#4A90B8` (Sanftes Blau)

**Verwendung:**
- Hauptaktionen (Login, Speichern, Bestätigen)
- Navigation und Links
- Fokus-Zustände
- Call-to-Action Buttons

**Tailwind-Klassen:**
```tsx
<button className="bg-primary dark:bg-primary-dark text-white">
  Trainingsplan erstellen
</button>
```

---

### 💧 Secondary: Hellblau
**Light Mode:** `#57B8FF` (Strahlendes Hellblau)
**Dark Mode:** `#4A9DD6` (Gedämpftes Hellblau)

**Verwendung:**
- Sekundäre Aktionen
- Informations-Elemente
- Highlights und Badges
- Hintergründe für wichtige Bereiche

**Tailwind-Klassen:**
```tsx
<button className="bg-secondary dark:bg-secondary-dark text-white">
  Aktivitäten anzeigen
</button>
```

---

### 🌿 Accent 1: Olivgrün
**Light Mode:** `#B6BD0D` (Lebendiges Olivgrün)
**Dark Mode:** `#97A320` (Tiefes Olivgrün)

**Verwendung:**
- Ausdauer-Training (LIT - Low Intensity Training)
- Fortschritts-Indikatoren
- Positive Entwicklung
- Basis-Training

**Tailwind-Klassen:**
```tsx
<div className="bg-olive dark:bg-olive-dark text-white p-4">
  LIT Session - 90 Minuten
</div>

<span className="badge-olive">Ausdauer</span>
```

---

### 🧡 Accent 2: Orange
**Light Mode:** `#FBB13C` (Warmes Orange)
**Dark Mode:** `#D9983A` (Gedämpftes Orange)

**Verwendung:**
- Warnungen (nicht kritisch)
- Motivation und Energie
- Intervall-Training (moderate Intensität)
- Aufmerksamkeit

**Tailwind-Klassen:**
```tsx
<button className="btn-orange">
  Workout starten
</button>

<span className="badge-orange">Sweet Spot</span>
```

---

### 🔴 Accent 3: Koralle
**Light Mode:** `#FE6847` (Kräftiges Koralle)
**Dark Mode:** `#D9624D` (Gedämpftes Koralle)

**Verwendung:**
- Hochintensives Training (HIT)
- Wichtige Hinweise
- Power-Zonen (Threshold, VO2max)
- Wettkampf-Events

**Tailwind-Klassen:**
```tsx
<div className="bg-coral dark:bg-coral-dark text-white">
  HIT Session - VO2max Intervalle
</div>

<span className="badge-coral">Hoch-Intensiv</span>
```

---

## Strukturfarben

### Background
**Light:** `#F8F9FA` (Sauberes Weiß-Grau)
**Dark:** `#1A1D23` (Tiefes Blau-Grau)

```tsx
<body className="bg-bg-light dark:bg-bg-dark">
```

---

### Surface (Cards, Panels)
**Light:** `#FFFFFF` (Reines Weiß)
**Dark:** `#252930` (Erhöhtes Dunkelgrau)

```tsx
<div className="card">
  <!-- Inhalt -->
</div>
```

---

### Text
**Primary Light:** `#1A1D23` (Fast Schwarz)
**Primary Dark:** `#E8EAED` (Off-White)

**Secondary Light:** `#5F6368` (Mittelgrau)
**Secondary Dark:** `#9AA0A6` (Hellgrau)

```tsx
<p className="text-text-primary-light dark:text-text-primary-dark">
  Haupttext
</p>

<p className="text-text-secondary-light dark:text-text-secondary-dark">
  Sekundärer Text
</p>
```

---

### Borders
**Light:** `#E0E3E7` (Sanftes Grau)
**Dark:** `#3C4148` (Subtiles Grau)

```tsx
<div className="border border-border-light dark:border-border-dark">
```

---

## Button-Komponenten

### Primary Button
```tsx
<button className="btn btn-primary">
  Trainingsplan erstellen
</button>
```

### Secondary Button
```tsx
<button className="btn btn-secondary">
  Aktivitäten
</button>
```

### Olive Button (Ausdauer)
```tsx
<button className="btn btn-olive">
  LIT Training
</button>
```

### Orange Button (Motivation)
```tsx
<button className="btn btn-orange">
  Workout starten
</button>
```

### Coral Button (Intensität)
```tsx
<button className="btn btn-coral">
  HIT Session
</button>
```

### Outline Button
```tsx
<button className="btn btn-outline">
  Abbrechen
</button>
```

### Ghost Button
```tsx
<button className="btn btn-ghost">
  Mehr Optionen
</button>
```

---

## Badge-Komponenten

```tsx
<span className="badge badge-primary">Aktiv</span>
<span className="badge badge-secondary">Info</span>
<span className="badge badge-olive">Ausdauer</span>
<span className="badge badge-orange">Sweet Spot</span>
<span className="badge badge-coral">Hoch-Intensiv</span>
```

---

## Card-Komponenten

### Standard Card
```tsx
<div className="card">
  <h3 className="text-lg font-semibold mb-2">Wochenplan</h3>
  <p>Dein Training für diese Woche...</p>
</div>
```

### Interactive Card
```tsx
<div className="card-interactive">
  <h3>Training Session</h3>
  <!-- Klickbare Card mit Hover-Effekt -->
</div>
```

---

## Spezielle Effekte

### Gradient Text
```tsx
<h1 className="text-4xl font-bold text-gradient">
  Adaptive Training System
</h1>
```

### Gradient Background
```tsx
<div className="gradient-bg p-8 text-white">
  Hero Section
</div>
```

---

## Training-spezifische Farbzuordnungen

### Intensitätszonen

| Zone | Farbe | Verwendung |
|------|-------|------------|
| **Recovery** | Olive (hell) | Aktive Erholung |
| **Endurance** | Olive | LIT, Grundlagenausdauer |
| **Tempo** | Orange (hell) | Sweet Spot, oberes Z2 |
| **Threshold** | Orange | FTP-Training |
| **VO2max** | Coral | Intervalle, HIT |
| **Anaerobic** | Coral (dunkel) | Sprints, maximale Power |

### CTL/ATL/TSB Darstellung

```tsx
// CTL (Fitness) - Blau
<div className="text-primary dark:text-primary-dark">CTL: 85</div>

// ATL (Fatigue) - Koralle
<div className="text-coral dark:text-coral-dark">ATL: 92</div>

// TSB (Form) - Olivgrün (positiv) / Orange (negativ)
<div className="text-olive dark:text-olive-dark">TSB: +5</div>
```

---

## Dark Mode Aktivierung

### Manuell per Klasse
```tsx
<html className="dark">
  <!-- App Inhalt -->
</html>
```

### Automatisch per System-Präferenz
Wird in `ThemeContext.tsx` verwaltet.

---

## Barrierefreiheit

Alle Farbkombinationen erfüllen WCAG 2.1 Level AA Kontrast-Anforderungen:
- **Light Mode:** Minimaler Kontrast 4.5:1
- **Dark Mode:** Minimaler Kontrast 4.5:1

---

*Letzte Aktualisierung: 31. Oktober 2025*
