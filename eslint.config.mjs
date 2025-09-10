// eslint.config.mjs  (minimal working flat config)
import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
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
      '*.md',
      '*.css',
      '*.scss',
      '*.svg'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@next/next': next, 'react-hooks': reactHooks, prettier }, // ✅ object, not array
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } }, // ✅ fix "<" JSX parsing
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      ...next.configs.recommended.rules, // ✅ only the rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'prettier/prettier': 'warn'
    }
  },
  eslintConfigPrettier // keep last
];
