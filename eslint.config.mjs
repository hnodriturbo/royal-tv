// eslint.config.mjs
import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import react from 'eslint-plugin-react'; // ✅ add
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

  // (Optional but nice): bring in React’s flat presets so JSX is handled well
  // If your installed version supports .configs.flat:
  ...(react.configs?.flat?.recommended ? [react.configs.flat.recommended] : []),
  ...(react.configs?.flat?.['jsx-runtime'] ? [react.configs.flat['jsx-runtime']] : []),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': next,
      react, // ✅ add
      'react-hooks': reactHooks,
      prettier
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node }
    },
    settings: {
      react: { version: 'detect' } // ✅ helps other react rules
    },
    rules: {
      ...next.configs.recommended.rules,

      // ✅ this is the key — marks JSX identifiers as “used”
      'react/jsx-uses-vars': 'error',

      // Not needed in React 17+ (no React import), but harmless if present:
      'react/jsx-uses-react': 'off',
      'no-unused-vars': ['warn', { caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'prettier/prettier': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='Link'] JSXAttribute[name.name='locale']",
          message: 'Do not use `locale` on next/link in the App Router. Prefix the path instead.'
        }
      ],
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/no-typos': 'warn'
    }
  },

  eslintConfigPrettier // keep last
];
