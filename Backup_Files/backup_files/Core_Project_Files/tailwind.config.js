import { fontFamily } from 'tailwindcss/defaultTheme';
import aspectRatio from '@tailwindcss/aspect-ratio';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/styles/**/*.{js,ts,jsx,tsx,mdx,css}',
    './config/**/*.{js,ts,jsx,tsx,mdx}',
    './cert/**/*.pem',
    './public/**/*.{html,css,js,gif,jpg,jpeg,webp,png}',
    './styles/**/*.css',
    './src/app/utils/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/components/**/*.{js,ts,jsx,tsx}',
    './src/app/user/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/admin/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', ...fontFamily.serif],
        alegreya: ['Alegreya', ...fontFamily.serif],
        playpens: ['Playpen Sans', ...fontFamily.sans],
      },
      backgroundImage: {
        'smooth-gradient': 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
      },
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        transform: 'transform',
        opacity: 'opacity',
      },
    },
  },
  plugins: [aspectRatio, forms, typography],
};
