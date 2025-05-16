// 📁 eslint.config.mjs
/**
 * 🚦 Royal-TV ESLint Flat Config (ESLint 9 + Next 15 + React 19)
 * --------------------------------------------------------------
 * 1️⃣ Uses *flat* config (no .eslintrc)
 * 2️⃣ Adds React, Hooks, Next, A11y, Import tidy-ups
 * 3️⃣ Puts Prettier last so it wins on formatting
 *
 * 👉  How to use:
 *     • Place at project root (same level as package.json)
 *     • Remove/rename any .eslintrc.* to avoid conflicts
 *     • VS Code: `"eslint.experimental.useFlatConfig": true` in settings
 */

import { defineConfig } from 'eslint/config'; // 1️⃣ core helper
import js from '@eslint/js'; // 2️⃣ JS base rules
import react from 'eslint-plugin-react'; // 3️⃣ React 🫶
import reactHooks from 'eslint-plugin-react-hooks'; // 4️⃣ Hooks 🔁
import jsxA11y from 'eslint-plugin-jsx-a11y'; // 5️⃣ A11y ♿
import importPlugin from 'eslint-plugin-import'; // 6️⃣ Import ✈️
import prettier from 'eslint-config-prettier'; // 7️⃣ Prettier 🧹
import { FlatCompat } from '@eslint/eslintrc'; // 8️⃣ Compat bridge
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// 🪄 Bridge classic configs (eg. Next) into flat config
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

// 🎉 Export the rule-array
export default defineConfig([
  // 1️⃣ Next.js recommended + Core Web Vitals
  ...compat.extends('plugin:@next/next/core-web-vitals'),

  // 2️⃣ ESLint’s own “recommended” JS rules
  js.configs.recommended,

  // 3️⃣ Custom layer for our JS / JSX files
  {
    files: ['**/*.{js,jsx}'],

    // 🛠️ Language settings
    languageOptions: {
      globals: {
        process: 'readonly', // ✅ Fix "process not defined"
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    // 🔌 Plugins we declared above
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      jsxA11y,
    },

    // 📏 Rules — add / tweak as you like
    rules: {
      // React ❌ unnecessary in Next 15
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Hooks ✅ must follow the rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import ✈️ order for readability
      'import/order': ['warn', { 'newlines-between': 'always' }],

      // A11y ♿ anchor example
      'jsx-a11y/anchor-is-valid': 'warn',
    },

    // ⚙️ Shared settings
    settings: {
      react: { version: 'detect' },
      next: { rootDir: ['src', './'] }, // allow /src as root
    },
  },

  // 4️⃣ Prettier last — turns off stylistic ESLint rules
  prettier,
]);
