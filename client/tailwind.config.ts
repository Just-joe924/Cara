import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#088178', // Cara teal
        'primary-soft': '#e8f6ea',
        'primary-border': '#cce7d0',
        header: '#e3e6f3',
        ink: '#222222',
        muted: '#465b52',
        'muted-2': '#606063',
        accent: '#ef3636',
        'accent-2': '#ec544e',
        navy: '#041e42',
        star: '#f3b519',
      },
      fontFamily: {
        sans: ['"League Spartan"', 'sans-serif'],
      },
      backgroundImage: {
        hero: "url('/img/hero4.png')",
        'shop-header': "url('/img/banner/b1.jpg')",
        'blog-header': "url('/img/banner/b19.jpg')",
        'about-header': "url('/img/about/banner.png')",
        'banner-repair': "url('/img/banner/b2.jpg')",
        newsletter: "url('/img/banner/b14.png')",
      },
    },
  },
  plugins: [],
} satisfies Config
