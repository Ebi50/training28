/**
 * ⚠️⚠️⚠️ KRITISCH: DESIGN SYSTEM - MASTER FILE ⚠️⚠️⚠️
 * 
 * 🔒 DIESE DATEI IST DIE ZENTRALE QUELLE FÜR ALLE STYLES! 🔒
 * 
 * WICHTIG:
 * - Spacing-Werte wurden nach mehreren Tests FINALISIERT (32px = PERFEKT!)
 * - Änderungen hier wirken sich auf ALLE Seiten aus!
 * - Siehe DESIGN_SYSTEM_MASTER.md für vollständige Dokumentation
 * 
 * VERWENDUNG IN JEDER KOMPONENTE/SEITE:
 * import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
 * 
 * BEISPIELE:
 * <div className={spacing.section}> ... </div>
 * <button className={components.button.primary}> ... </button>
 * <h2 className={typography.h2}> ... </h2>
 * 
 * EVOLUTION:
 * V1: 4px → Zu eng
 * V2: 16px → Gut
 * V3: 32px → ✅ PERFEKT! (FINAL - NICHT MEHR ÄNDERN!)
 * 
 * 🚨 BEI ÄNDERUNGEN: Dokumentiere in DESIGN_SYSTEM_MASTER.md! 🚨
 */

// ==================== SPACING ====================
// Konsistente Abstände für das gesamte Layout
export const spacing = {
  // Layout Spacing
  page: 'p-8',              // 32px - Außenabstand für ganze Seiten
  section: 'space-y-8',     // 32px - Abstand zwischen großen Sektionen
  card: 'p-8',              // 32px - Padding innerhalb von Cards
  cardGap: 'gap-8',         // 32px - Gap zwischen Cards in einem Grid
  
  // Content Spacing
  contentBlock: 'space-y-6',    // 24px - Abstand zwischen Content-Blöcken
  contentInline: 'gap-6',       // 24px - Horizontaler Abstand (z.B. Buttons nebeneinander)
  
  // Tight Spacing (für kompakte Bereiche)
  tight: 'space-y-4',       // 16px - Eng zusammenstehende Elemente
  tightInline: 'gap-4',     // 16px - Horizontaler Abstand eng
  
  // Micro Spacing (für Labels, kleine Abstände)
  micro: 'space-y-2',       // 8px - Sehr kleine Abstände
  microInline: 'gap-2',     // 8px - Horizontaler Abstand sehr klein
  
  // Header/Footer
  header: 'p-8',            // 32px - Header Padding
  headerGap: 'gap-8',       // 32px - Gap im Header
} as const;

// ==================== TYPOGRAPHY ====================
// Konsistente Schriftgrößen und Gewichte
export const typography = {
  // Headings
  h1: 'text-2xl font-bold',          // 24px bold - Hauptüberschriften
  h2: 'text-xl font-semibold',       // 20px semibold - Sektionsüberschriften
  h3: 'text-lg font-semibold',       // 18px semibold - Unterüberschriften
  
  // Body Text
  body: 'text-base',                 // 16px - Standard Text
  bodyLarge: 'text-lg',              // 18px - Größerer Body Text
  bodySmall: 'text-sm',              // 14px - Kleinerer Text
  
  // Special
  label: 'text-sm font-medium',      // 14px medium - Form Labels
  caption: 'text-xs',                // 12px - Captions, Hints
  
  // Weights (für Kombinationen)
  bold: 'font-bold',
  semibold: 'font-semibold',
  medium: 'font-medium',
  normal: 'font-normal',
} as const;

// ==================== COLORS ====================
// Zentrale Farbdefinitionen (nutzt Tailwind + Custom Colors)
export const colors = {
  // Backgrounds
  bg: {
    primary: 'bg-bg-primary-light dark:bg-bg-primary-dark',
    secondary: 'bg-bg-secondary-light dark:bg-bg-secondary-dark',
    card: 'bg-white dark:bg-gray-800',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
  },
  
  // Text
  text: {
    primary: 'text-text-primary-light dark:text-text-primary-dark',
    secondary: 'text-text-secondary-light dark:text-text-secondary-dark',
    muted: 'text-gray-500 dark:text-gray-400',
    inverse: 'text-white dark:text-gray-900',
  },
  
  // Borders
  border: {
    default: 'border-border-light dark:border-border-dark',
    focus: 'focus:border-primary dark:focus:border-primary-dark',
    hover: 'hover:border-primary dark:hover:border-primary-dark',
  },
  
  // Status Colors
  status: {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  
  // Primary Brand Colors
  primary: 'bg-primary dark:bg-primary-dark text-white',
  primaryText: 'text-primary dark:text-primary-dark',
} as const;

// ==================== COMPONENTS ====================
// Vordefinierte Komponenten-Styles

export const components = {
  // Buttons
  button: {
    // Basis für alle Buttons
    base: `${typography.body} font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`,
    
    // Primary Button (Hauptaktionen)
    primary: `${typography.body} font-medium px-4 py-2 ${colors.primary} rounded-md hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`,
    
    // Secondary Button (Sekundäre Aktionen)
    secondary: `${typography.body} font-medium px-4 py-2 ${colors.bg.card} ${colors.text.primary} border ${colors.border.default} rounded-md ${colors.bg.hover} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`,
    
    // Small Button
    small: `${typography.bodySmall} font-medium px-3 py-1.5 ${colors.primary} rounded-md hover:opacity-90 transition-colors`,
    
    // Icon Button
    icon: `p-2 rounded-md ${colors.bg.hover} ${colors.text.primary} transition-colors`,
    
    // Danger Button
    danger: `${typography.body} font-medium px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`,
  },
  
  // Input Fields
  input: {
    base: `${typography.body} block w-full px-3 py-2 ${colors.bg.card} ${colors.text.primary} border ${colors.border.default} rounded-md ${colors.border.focus} focus:ring-1 focus:ring-primary transition-colors`,
    
    small: `${typography.bodySmall} block w-full px-2 py-1.5 ${colors.bg.card} ${colors.text.primary} border ${colors.border.default} rounded-md ${colors.border.focus} focus:ring-1 focus:ring-primary transition-colors`,
    
    // Mit Fehler
    error: `${typography.body} block w-full px-3 py-2 ${colors.bg.card} ${colors.text.primary} border border-red-500 dark:border-red-600 rounded-md focus:ring-1 focus:ring-red-500 transition-colors`,
  },
  
  // Labels
  label: {
    default: `${typography.label} ${colors.text.primary} block`,
    required: `${typography.label} ${colors.text.primary} block after:content-['*'] after:ml-0.5 after:text-red-500`,
  },
  
  // Cards
  card: {
    base: `${colors.bg.card} border ${colors.border.default} rounded-lg ${spacing.card} shadow-sm`,
    hover: `${colors.bg.card} border ${colors.border.default} rounded-lg ${spacing.card} shadow-sm ${colors.bg.hover} transition-colors cursor-pointer`,
    elevated: `${colors.bg.card} rounded-lg ${spacing.card} shadow-md`,
  },
  
  // Grid Layouts
  grid: {
    cols2: `grid grid-cols-1 md:grid-cols-2 ${spacing.cardGap}`,
    cols3: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${spacing.cardGap}`,
    cols4: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${spacing.cardGap}`,
  },
  
  // Badges/Pills
  badge: {
    default: `${typography.bodySmall} inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${colors.bg.secondary} ${colors.text.primary}`,
    success: `${typography.bodySmall} inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${colors.status.success}`,
    warning: `${typography.bodySmall} inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${colors.status.warning}`,
    error: `${typography.bodySmall} inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${colors.status.error}`,
    info: `${typography.bodySmall} inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${colors.status.info}`,
  },
  
  // Divider
  divider: `border-t ${colors.border.default} my-4`,
} as const;

// ==================== LAYOUT HELPERS ====================
// Utility classes für häufige Layout-Patterns

export const layout = {
  // Container (max width mit centered)
  container: 'max-w-7xl mx-auto px-4',
  containerNarrow: 'max-w-4xl mx-auto px-4',
  containerWide: 'max-w-full px-4',
  
  // Flex Layouts
  flexRow: 'flex flex-row items-center',
  flexRowBetween: 'flex flex-row items-center justify-between',
  flexRowCenter: 'flex flex-row items-center justify-center',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',
  
  // Common Patterns
  pageHeader: `${spacing.section} ${typography.h1} ${colors.text.primary}`,
  sectionHeader: `${spacing.contentBlock} ${typography.h2} ${colors.text.primary}`,
} as const;

// ==================== ANIMATION ====================
// Konsistente Transition/Animation Zeiten

export const animation = {
  transition: 'transition-all duration-200 ease-in-out',
  transitionSlow: 'transition-all duration-300 ease-in-out',
  transitionFast: 'transition-all duration-150 ease-in-out',
} as const;

// ==================== EXPORT DEFAULT ====================
// Gesamtes Design System als Default Export

export default {
  spacing,
  typography,
  colors,
  components,
  layout,
  animation,
} as const;
