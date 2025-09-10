// eslint.config.js (ESM)
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'coverage/**',
      'public/**',
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '*.md',
      '*.css',
      '*.scss',
      '*.svg',
      '*.eslintignore'
    ]
  },
  js.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin, // ⚡ Next rules namespace
      prettier: prettierPlugin, // 🎨 Prettier as a rule
      'react-hooks': reactHooks // 🪝 Hooks rules
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      //...nextPlugin.configs['core-web-vitals']?.rules, // optional
      '@next/next/google-font-display': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'prettier/prettier': 'warn'
    }
  },
  prettierFlat
];
