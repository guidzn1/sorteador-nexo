/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#050810',
        elevated: '#0C1421',
        card: '#0F1A2B',
        border: '#1D2C45',
        muted: '#7C8AA8',
        ink: '#EAF1FB',
        blue: {
          DEFAULT: '#2F6FED',
          dim: '#5B8CFF',
          deep: '#1B3E8C',
        },
        success: '#2ED573',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'lane-lines': 'repeating-linear-gradient(115deg, rgba(47,111,237,0.08) 0px, rgba(47,111,237,0.08) 2px, transparent 2px, transparent 120px)',
      },
    },
  },
  plugins: [],
}
