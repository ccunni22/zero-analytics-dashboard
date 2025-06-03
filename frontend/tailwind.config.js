/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#172133',
          light: '#22304a',
        },
        border: {
          subtle: 'rgba(255,255,255,0.08)',
          blue: 'rgba(80,150,255,0.12)',
        },
        accent: {
          DEFAULT: '#5ecbfa',
          gray: '#b8c7d1',
        },
        card: {
          DEFAULT: '#22304a',
        },
        chart: {
          line: '#5ecbfa',
          area: 'rgba(94,203,250,0.18)',
          grid: '#2a3a55',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'neon-pulse': 'neonPulse 1.5s ease-in-out infinite',
        'gradient-flow': 'gradientFlow 15s ease infinite',
        'modal-fade-in': 'modalFadeIn 0.3s ease-out forwards',
        'chart-fade-in': 'chartFadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        neonPulse: {
          '0%, 100%': {
            textShadow: '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa, 0 0 102px #0fa, 0 0 151px #0fa',
          },
          '50%': {
            textShadow: '0 0 4px #fff, 0 0 7px #fff, 0 0 18px #fff, 0 0 38px #0fa, 0 0 73px #0fa, 0 0 80px #0fa, 0 0 94px #0fa, 0 0 140px #0fa',
          },
        },
        gradientFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        modalFadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        chartFadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '6px',
        md: '12px',
        lg: '18px',
      },
      boxShadow: {
        none: 'none',
        'inner-subtle': 'inset 0 1px 2px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(135deg, #101024 0%, #18182f 100%)',
        'card-glass': 'linear-gradient(120deg, rgba(16,16,36,0.7) 60%, rgba(34,24,56,0.6) 100%)',
        'chart-gradient': 'linear-gradient(90deg, #0fffc0 0%, #38cfff 100%)',
      },
      borderWidth: {
        DEFAULT: '1px',
        subtle: '1px',
      },
      borderRadius: {
        md: '10px',
        lg: '16px',
        xl: '20px',
      },
    },
  },
  plugins: [],
} 