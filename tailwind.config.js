/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via class strategy
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm Color Scheme - Light & Dark Mode
        primary: {
          // Amber 600 for light, Orange 400 for dark
          DEFAULT: '#D97706', // Light mode primary
          dark: '#FB923C',     // Dark mode primary
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        secondary: {
          // Terrakotta for light, Amber 500 for dark
          DEFAULT: '#C2410C', // Light mode secondary
          dark: '#F59E0B',     // Dark mode secondary
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        accent: {
          // Sand for light, Sand light for dark
          DEFAULT: '#FDE68A',
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        // Success - Orange tone instead of green
        success: {
          DEFAULT: '#F97316', // Orange 500
          light: '#FB923C',   // Orange 400
          dark: '#EA580C',    // Orange 600
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
        },
        // Warning - Amber
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        // Error - Red tones
        error: {
          DEFAULT: '#DC2626', // Light mode
          dark: '#F87171',     // Dark mode
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        // Info - Blue tones
        info: {
          DEFAULT: '#38BDF8', // Light mode
          dark: '#93C5FD',     // Dark mode
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#38BDF8',
          600: '#0EA5E9',
        },
        // Background colors
        bg: {
          warm: '#FFF7ED',     // Light mode background
          'warm-dark': '#0C0A09', // Dark mode background
        },
        // Card/Surface colors
        surface: {
          warm: '#FFFFFF',     // Light mode cards
          'warm-dark': '#1C1917', // Dark mode cards
        },
        // Text colors - warm grays
        text: {
          primary: {
            light: '#1C1917',  // Light mode primary text
            dark: '#E7E5E4',   // Dark mode primary text
          },
          secondary: {
            light: '#57534E',  // Light mode secondary text
            dark: '#A8A29E',   // Dark mode secondary text
          },
        },
        // Borders - warm grays
        border: {
          light: '#E7E5E4',    // Light mode borders
          dark: '#292524',     // Dark mode borders
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}