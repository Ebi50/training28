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
        // New Balanced Color Scheme - Light & Dark Mode
        
        // Primary: Payne's Gray (Light) / Celadon (Dark)
        primary: {
          DEFAULT: '#546A76', // Light mode primary (Payne's Gray)
          dark: '#B4CEB3',     // Dark mode primary (Celadon)
          50: '#F0F4F6',
          100: '#D9E2E7',
          200: '#B3C5CF',
          300: '#8DA8B7',
          400: '#678B9F',
          500: '#546A76',      // Payne's Gray
          600: '#43555E',
          700: '#324047',
          800: '#212A2F',
          900: '#111518',
        },
        
        // Secondary: Cadet Gray (Light) / Timberwolf (Dark)
        secondary: {
          DEFAULT: '#88A0A8', // Light mode secondary (Cadet Gray)
          dark: '#DBD3C9',     // Dark mode secondary (Timberwolf)
          50: '#F5F7F8',
          100: '#E6EBED',
          200: '#CCD7DB',
          300: '#B3C3C9',
          400: '#99AFB7',
          500: '#88A0A8',      // Cadet Gray
          600: '#6D8087',
          700: '#526065',
          800: '#364044',
          900: '#1B2022',
        },
        
        // Accent: Mimi Pink
        accent: {
          DEFAULT: '#FAD4D8', // Mimi Pink
          50: '#FFFBFC',
          100: '#FEF5F6',
          200: '#FDEAED',
          300: '#FBE0E3',
          400: '#FAD4D8',      // Mimi Pink
          500: '#F7B5BC',
          600: '#F396A0',
          700: '#EF7784',
          800: '#EB5868',
          900: '#E7394C',
        },
        
        // Background colors
        bg: {
          warm: '#DBD3C9',         // Light mode background (Timberwolf)
          'warm-dark': '#546A76',  // Dark mode background (Payne's Gray)
        },
        
        // Card/Surface colors
        surface: {
          warm: '#B4CEB3',         // Light mode cards (Celadon)
          'warm-dark': '#88A0A8',  // Dark mode cards (Cadet Gray)
        },
        
        // Text colors
        text: {
          primary: {
            light: '#546A76',    // Light mode primary text (Payne's Gray)
            dark: '#DBD3C9',     // Dark mode primary text (Timberwolf)
          },
          secondary: {
            light: '#88A0A8',    // Light mode secondary text (Cadet Gray)
            dark: '#B4CEB3',     // Dark mode secondary text (Celadon)
          },
          onLight: '#546A76',    // Text on light backgrounds
          onDark: '#F8F9FA',     // Text on dark backgrounds
        },
        
        // Borders
        border: {
          light: '#B4CEB3',      // Light mode borders (Celadon)
          dark: '#88A0A8',       // Dark mode borders (Cadet Gray)
        },
        
        // Status colors (keeping functional colors)
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}