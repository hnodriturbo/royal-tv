// eslint.config.mjs
import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
  // 🧹 Ignore folders and assets
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
    ],
    linterOptions: { reportUnusedDisableDirectives: true } // 🔔 surfaces unused /* eslint-disable */
  },

  // 🧠 Base JS rules
  js.configs.recommended,

  // 🧩 Make Next plugin VISIBLE to Next (global block)
  {
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...(next.configs['core-web-vitals']?.rules ?? {}) // ✅ include core-web-vitals if available
    }
  },

  // 🧰 React/Prettier + your custom rules (scoped to source files)
  ...(react.configs?.flat?.recommended ? [react.configs.flat.recommended] : []),
  ...(react.configs?.flat?.['jsx-runtime'] ? [react.configs.flat['jsx-runtime']] : []),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': next,
      react,
      'react-hooks': reactHooks,
      prettier
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node }
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Next rules already applied globally; fine to keep recommended here too
      // ...next.configs.recommended.rules,

      // ✅ mark JSX vars as used
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',

      // 🟨 make unused-vars calmer & underscore-friendly
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_', // allow const _unused = ...
          argsIgnorePattern: '^_', // allow function fn(_unused) {}
          destructuredArrayIgnorePattern: '^_'
        }
      ],

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      // Prettier formatting as a warning (not blocking builds)
      'prettier/prettier': 'warn',

      // ❌ disallow locale prop on next/link in App Router
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='Link'] JSXAttribute[name.name='locale']",
          message: 'Do not use `locale` on next/link in the App Router. Prefix the path instead.'
        }
      ],

      // PropTypes not required in your JS project
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/no-typos': 'warn'
    }
  },

  // Keep last to turn off rules that conflict with Prettier
  eslintConfigPrettier
];
