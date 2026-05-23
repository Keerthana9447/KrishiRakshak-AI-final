/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    { pattern: /bg-(red|amber|orange|forest|lime|emerald|sky|blue|violet|green|teal)-(500|600|700|800|900|950)\/(5|8|10|15|20|25|30)/ },
    { pattern: /text-(red|amber|orange|forest|lime|emerald|sky|blue|violet|green|teal)-(300|400|500)/ },
    { pattern: /border-(red|amber|orange|forest|lime|emerald|sky|blue|green|teal)-(500|600|700|800|900)\/(10|15|20|25|30|40)/ },
    'card-hover','glass','glass-dark','glass-green','glass-card',
    'btn-primary','btn-secondary','glow-btn',
    'upload-zone','skeleton','scan-line','mesh-bg','hero-pattern',
    'gradient-text','gradient-text-gold','glow-text',
    'severity-bar','severity-fill','severity-none','severity-low',
    'severity-medium','severity-high','severity-critical',
    'font-telugu','font-display',
    'animate-float','animate-pulse-glow','animate-fade-up',
    'input-field','nav-link',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac',
          400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d',
          800:'#166534', 900:'#14532d', 950:'#052e16',
        },
        earth: {
          50:'#fdf8f0', 100:'#faefd8', 200:'#f4dba8', 300:'#ebbf6e',
          400:'#e0a03c', 500:'#d4871f', 600:'#b86c16', 700:'#964f15',
          800:'#7a3f18', 900:'#653417',
        },
        soil: {
          700:'#3d2e1c', 800:'#2a1f12', 900:'#1a1209',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Space Grotesk"', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        telugu:  ['"Noto Sans Telugu"', '"Noto Serif Telugu"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2.5s ease-in-out infinite',
        'fade-up':     'fadeUp 0.6s ease-out forwards',
        'shimmer':     'shimmer 1.5s linear infinite',
        'spin-slow':   'spin 8s linear infinite',
        'scan':        'scanMove 2s ease-in-out infinite',
      },
      keyframes: {
        float:     { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-18px)' } },
        pulseGlow: { '0%,100%':{ boxShadow:'0 0 20px rgba(34,197,94,0.3)' }, '50%':{ boxShadow:'0 0 50px rgba(34,197,94,0.7)' } },
        fadeUp:    { from:{ opacity:'0', transform:'translateY(28px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        shimmer:   { '0%':{ backgroundPosition:'-200% 0' }, '100%':{ backgroundPosition:'200% 0' } },
        scanMove:  { '0%':{ top:'0%',opacity:'0' }, '10%':{ opacity:'1' }, '90%':{ opacity:'1' }, '100%':{ top:'100%',opacity:'0' } },
      },
    },
  },
  plugins: [],
}
