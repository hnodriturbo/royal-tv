// @ts-nocheck
// eslint.config.mjs
import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import prettierCfg from 'eslint-config-prettier';

const config = [
  js.configs.recommended,
  pluginNext, // includes core-web-vitals
  prettierCfg, // disables style rules Prettier already fixes
  {
    files: ['**/*.{js,jsx}'],
    plugins: { prettier: pluginPrettier, 'react-hooks': pluginReactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'prettier/prettier': 'warn'
    }
  }
];

export default config;
