// @ts-nocheck
// ======================== eslint.config.mjs ========================
// 📏 Main ESLint config for Royal TV
// - Integrates JS, Next.js, Prettier, React Hooks rules
// ===================================================================

import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import prettierCfg from 'eslint-config-prettier';

const config = [
  js.configs.recommended, // ✅ Base JS rules
  pluginNext, // ⚡ Next.js & web-vitals
  prettierCfg, // 🧹 Disables rules covered by Prettier
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      prettier: pluginPrettier, // 🎨 Prettier integration
      'react-hooks': pluginReactHooks // 🪝 React Hooks linting
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error', // ❗ Enforce Rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // ⚠️ Warn on missing deps
      'prettier/prettier': 'warn' // 🔔 Prettier formatting issues
    }
  }
];

export default config;
