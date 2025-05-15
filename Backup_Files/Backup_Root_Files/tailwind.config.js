// tailwind.config.js – Tailwind v4 configuration for Royal‑TV 🎨
// ----------------------------------------------------------------
// 1️⃣  Full content globs (unchanged)
// 2️⃣  Extends theme with custom fonts, gradients & breakpoints
// 3️⃣  Keeps existing plugins (aspect‑ratio, forms, typography)
// ----------------------------------------------------------------

import defaultTheme from 'tailwindcss/defaultTheme.js'; // 🪄 ESM import
import aspectRatio from '@tailwindcss/aspect-ratio';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const { fontFamily } = defaultTheme;

export default {
  // 1️⃣  Content globs — full project
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/styles/**/*.{js,ts,jsx,tsx,mdx,css}',
    './config/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.{html,css,js,gif,jpg,jpeg,webp,png}',
    './styles/**/*.css',
    './src/app/utils/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/user/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/admin/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // 2️⃣  Theme extensions
  theme: {
    extend: {
      /* ------------ Fonts ------------ */
      fontFamily: {
        serif: ['Playfair Display', ...fontFamily.serif],
        alegreya: ['Alegreya', ...fontFamily.serif],
        playpens: ['Playpen Sans', ...fontFamily.sans],
      },

      /* ------------ Gradients (generate bg‑smooth‑gradient*) ------------ */
      backgroundImage: {
        'smooth-gradient': 'linear-gradient(to bottom right,#2a2e45,#6b82a6,#8b93b0)',
        'smooth-gradient-light-1': 'linear-gradient(to bottom right,#394050,#7c90af,#a1a9c1)',
        'smooth-gradient-light-2': 'linear-gradient(to bottom right,#4a5363,#8ea0bd,#b1bacd)',
        'smooth-gradient-light-3': 'linear-gradient(to bottom right,#5b6676,#9db1cb,#c0c9da)',
        'smooth-gradient-light-4': 'linear-gradient(to bottom right,#6c7890,#adbfd9,#cfd8e7)',
        'smooth-gradient-light-5': 'linear-gradient(to bottom right,#7d8aa5,#bccce7,#dde5f4)',
        'smooth-gradient-dark-1': 'linear-gradient(to bottom right,#252a3f,#5f7596,#7a849f)',
        'smooth-gradient-dark-2': 'linear-gradient(to bottom right,#202534,#55688a,#6f738f)',
        'smooth-gradient-dark-3': 'linear-gradient(to bottom right,#1b1f2a,#4b5b7e,#656882)',
        'smooth-gradient-dark-4': 'linear-gradient(to bottom right,#16181f,#414f72,#5a5d75)',
        'smooth-gradient-dark-5': 'linear-gradient(to bottom right,#12141a,#373b66,#505368)',
      },

      /* ------------ Breakpoints ------------ */
      screens: {
        mobile: { max: '991px' },
        pc: '992px',
      },
      boxShadow: {
        'box-1-1': '10px 5px 10px 5px rgba(32,40,69,.797)',
        'box-1': '0 0 10px 5px rgba(32,40,69,.797)',
        'box-2': '0 0 15px 7px rgba(50,60,80,.7)',
        'box-3': '0 0 20px 10px rgba(20,30,60,.8)',
        'box-4': '0 0 25px 12px rgba(60,70,90,.75)',
        'box-5': '0 0 30px 15px rgba(40,50,70,.85)',
      },
      /* ------------ Extra transitions ------------ */
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        transform: 'transform',
        opacity: 'opacity',
      },
    },
  },

  // 3️⃣  Plugins (built‑ins + custom box‑shadow utilities)
  plugins: [aspectRatio, forms, typography],
};
