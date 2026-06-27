/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Dopamina Crew — nueva identidad visual
        background: '#0A0A0F',
        industrial: {
          950: '#0A0A0F',   // Negro casi puro (base)
          900: '#10101A',   // Variante oscura
          800: '#18181F',   // Bordes y cards
          700: '#22222D',   // Superficies elevadas
          400: '#9A9A9A',   // Gris claro (textos secundarios)
          200: '#C8C8CC',   // Textos terciarios
        },
        neon: {
          purple: 'var(--color-neon)',
          violet: 'var(--color-neon-light)',
          glow:   'var(--color-neon-glow)',
        },
        bone: '#F2F0F5',        // Blanco hueso (textos principales)
        muted: '#9A9A9A',       // Gris claro utilitario
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-sm': '0 0 10px var(--color-neon-shadow-sm)',
        'neon-md': '0 0 22px var(--color-neon-shadow-md)',
        'neon-lg': '0 0 40px var(--color-neon-shadow-lg)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.8, filter: 'drop-shadow(0 0 5px rgba(177, 78, 255, 0.5))' },
          '50%':       { transform: 'scale(1.05)', opacity: 1, filter: 'drop-shadow(0 0 20px rgba(201, 127, 255, 0.9))' },
        }
      }
    },
  },
  plugins: [],
}
