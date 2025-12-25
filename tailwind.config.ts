import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './popup.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 24HRMVP Liquid Chrome Color System
        // Primary Neon Palette
        'neon-cyan': '#04D9FF',
        'neon-blue': '#1F51FF',
        'electric-cyan': '#00FEFC',
        'tron-blue': '#7DFDFE',
        'neon-purple': '#8A00C4',
        'neon-pink': '#FB48C4',
        'neon-orange': '#FF5C00',
        'neon-green': '#2CFF05',
        'neon-yellow': '#FFFF00',
        
        // Dogendary-specific (Encryption Accents)
        'encrypt-cyan': '#00D9FF',
        'relay-magenta': '#FF00FF',
        'transport-blue': '#0080FF',
        'terminal-green': '#00FF00',
        
        // Rarity Metals
        'gold-chrome': '#D4AF37',
        'platinum': '#E8E8E8',
        'silver-chrome': '#C0C0C0',
        'gunmetal': '#2C3E50',
        'steel': '#70737A',
        'matte-black': '#1A1A1A',
        'chrome-black': '#333333',
        'classic-chrome': '#A9A9A9',
        
        // Background System
        'bg-deepest': '#0B192A',
        'bg-primary': '#1E1E1E',
        'bg-charcoal': '#232729',
        'bg-void': '#0B0E27',
        'surface-dark': '#1A1D3A',
        
        // Surface Elevation
        'surface-1': '#2E2E2E',
        'surface-2': '#383838',
        'surface-3': '#424242',
        
        // Text Hierarchy
        'text-primary': '#FAFAFA',
        'text-secondary': '#B0B0B0',
        'text-tertiary': '#808080',
        'terminal-white': '#E3E3E3',
        'comment-grey': '#A8A9AD',
        
        // Borders
        'border-default': '#3D4159',
        'border-active': '#00D9FF',
      },
      fontFamily: {
        'display': ['Orbitron', 'monospace'],
        'heading': ['Space Grotesk', 'sans-serif'],
        'body': ['DM Sans', 'sans-serif'],
        'mono': ['Space Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(4, 217, 255, 0.3), 0 0 20px rgba(4, 217, 255, 0.2)',
        'neon-cyan-strong': '0 0 15px rgba(4, 217, 255, 0.5), 0 0 30px rgba(4, 217, 255, 0.3)',
        'neon-green': '0 0 10px rgba(44, 255, 5, 0.3)',
        'neon-orange': '0 0 10px rgba(255, 92, 0, 0.3)',
        'chrome': 'inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.3), 0 2px 5px rgba(0, 0, 0, 0.3)',
        'glass': '0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'chrome-gradient': 'linear-gradient(135deg, #A8A9AD 0%, #B4B5B8 20%, #C0C0C3 40%, #CBCCCD 60%, #D7D7D8 80%, #E3E3E3 100%)',
        'chrome-reflective': 'linear-gradient(180deg, #4B505A 0%, #B0C4DE 25%, #D1E1F6 50%, #CCCCCC 75%, #D8D8D8 100%)',
        'chrome-flow': 'linear-gradient(90deg, #999 5%, #fff 10%, #ccc 30%, #ddd 50%, #ccc 70%, #fff 80%, #999 95%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F0E68C 50%, #D4AF37 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(190, 190, 190, 0.15), rgba(230, 230, 230, 0.25))',
        'void-gradient': 'linear-gradient(180deg, rgba(11, 14, 39, 0.9) 0%, rgba(26, 29, 58, 0.9) 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shine-sweep': 'shine-sweep 0.6s ease-out',
        'count-up': 'count-up 0.4s ease-out',
        'glitch': 'glitch 0.2s ease-in-out',
        'breath': 'breath 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 20px rgba(4, 217, 255, 0.4)',
          },
          '50%': { 
            opacity: '0.7',
            boxShadow: '0 0 40px rgba(4, 217, 255, 0.6)',
          },
        },
        'shine-sweep': {
          'from': { left: '-100%' },
          'to': { left: '200%' },
        },
        'count-up': {
          'from': { 
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'breath': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
      },
      borderRadius: {
        'chrome': '50px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'elastic': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      },
    },
  },
  plugins: [],
};

export default config;
