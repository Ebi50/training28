# ⚠️ DESIGN SYSTEM - QUICK START

## 🎯 IN JEDER NEUEN/GEÄNDERTEN DATEI:

### 1. Import hinzufügen (ERSTE Zeile nach anderen Imports):
```typescript
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
```

### 2. Verwende NIEMALS mehr manuelle Werte:
❌ `className="space-y-6 p-6 gap-4"`  
✅ `className={spacing.section}`

### 3. Standard Pattern:
```tsx
<div className={spacing.page}>
  <div className={spacing.section}>
    <div className={components.card.base}>
      <h2 className={typography.h2}>Title</h2>
      <input className={components.input.base} />
      <button className={components.button.primary}>Save</button>
    </div>
  </div>
</div>
```

## 📁 Master Dokumentation:
- **DESIGN_SYSTEM_MASTER.md** ← ALLES drin! Lesen bei Fragen!
- **src/styles/designSystem.ts** ← Die Quelle

## ✅ Spacing-Werte (FINAL - 32px):
- `spacing.page` = 32px Padding
- `spacing.section` = 32px zwischen Sections
- `spacing.card` = 32px in Cards
- `spacing.cardGap` = 32px zwischen Grid Items

**NICHT MEHR ÄNDERN!** Diese Werte sind nach mehreren Tests **FINAL**!

---

**🔥 Bei Problemen: Schaue in DESIGN_SYSTEM_MASTER.md! 🔥**
