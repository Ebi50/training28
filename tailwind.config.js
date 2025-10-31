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
        // New Color Scheme - Light & Dark Mode
        // Light: Vibrant athletic colors
        // Dark: Muted sophisticated tones
        
        // Primary: Blue (athletic, trust, performance)
        primary: {
          DEFAULT: '#2176AE',    // Light mode - Bright Blue
          dark: '#4A90B8',       // Dark mode - Softer Blue
          50: '#E8F4F9',
          100: '#C5E3F0',
          200: '#9FD1E6',
          300: '#79BFDB',
          400: '#5DB1D1',
          500: '#2176AE',        // Main Blue
          600: '#1B6292',
          700: '#164E76',
          800: '#103A5A',
          900: '#0A263E',
        },
        
        // Secondary: Light Blue (energy, clarity)
        secondary: {
          DEFAULT: '#57B8FF',    // Light mode - Bright Light Blue
          dark: '#4A9DD6',       // Dark mode - Muted Light Blue
          50: '#E8F6FF',
          100: '#C7E7FF',
          200: '#A3D8FF',
          300: '#7FC9FF',
          400: '#5BC1FF',
          500: '#57B8FF',        // Main Light Blue
          600: '#2D9FE8',
          700: '#1F7DBB',
          800: '#165B8E',
          900: '#0D3961',
        },
        
        // Accent 1: Olive Green (growth, endurance)
        olive: {
          DEFAULT: '#B6BD0D',    // Light mode - Vibrant Olive
          dark: '#97A320',       // Dark mode - Deeper Olive
          50: '#F7F8E2',
          100: '#ECEEB9',
          200: '#E0E38B',
          300: '#D4D85D',
          400: '#C8CD2F',
          500: '#B6BD0D',        // Main Olive
          600: '#939A0A',
          700: '#707707',
          800: '#4D5405',
          900: '#2A3103',
        },
        
        // Accent 2: Orange (energy, motivation)
        orange: {
          DEFAULT: '#FBB13C',    // Light mode - Warm Orange
          dark: '#D9983A',       // Dark mode - Muted Orange
          50: '#FFF7E8',
          100: '#FEEAC5',
          200: '#FDDC9F',
          300: '#FCCF79',
          400: '#FCC053',
          500: '#FBB13C',        // Main Orange
          600: '#E59418',
          700: '#B8740F',
          800: '#8A550B',
          900: '#5C3607',
        },
        
        // Accent 3: Coral (intensity, power)
        coral: {
          DEFAULT: '#FE6847',    // Light mode - Bright Coral
          dark: '#D9624D',       // Dark mode - Muted Coral
          50: '#FFF0ED',
          100: '#FED8D1',
          200: '#FDBBAF',
          300: '#FD9E8D',
          400: '#FC826B',
          500: '#FE6847',        // Main Coral
          600: '#E64425',
          700: '#B9341D',
          800: '#8B2716',
          900: '#5D1A0E',
        },
        
        // Background colors
        bg: {
          light: '#F8F9FA',         // Light mode - Clean white-gray
          dark: '#1A1D23',          // Dark mode - Deep blue-gray
        },
        
        // Card/Surface colors
        surface: {
          light: '#FFFFFF',         // Light mode - Pure white
          dark: '#252930',          // Dark mode - Elevated dark gray
        },
        
        // Text colors
        text: {
          primary: {
            light: '#1A1D23',    // Light mode - Almost black
            dark: '#E8EAED',     // Dark mode - Off white
          },
          secondary: {
            light: '#5F6368',    // Light mode - Medium gray
            dark: '#9AA0A6',     // Dark mode - Light gray
          },
        },
        
        // Borders
        border: {
          light: '#E0E3E7',      // Light mode - Soft gray
          dark: '#3C4148',       // Dark mode - Subtle gray
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