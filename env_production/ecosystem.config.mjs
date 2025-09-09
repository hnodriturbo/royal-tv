// ecosystem.config.mjs
// 🧭 PM2 ESM config (works with "type":"module")
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOTENV_PROD = path.join(__dirname, '.env');

export default {
  apps: [
    {
      name: 'royal-tv-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/royal-tv',
      interpreter: 'node',
      interpreter_args: '-r dotenv/config', // preload dotenv
      env: {
        NODE_ENV: 'production',
        DOTENV_CONFIG_PATH: DOTENV_PROD,
        MESSAGES_DIR: '/root/royal-tv/messages'
      },
      time: true,
      max_restarts: 10,
      autorestart: true
    },
    {
      name: 'royal-tv-backend',
      script: 'server.js',
      cwd: '/root/royal-tv',
      interpreter: 'node',
      interpreter_args: '-r dotenv/config',
      env: {
        NODE_ENV: 'production',
        DOTENV_CONFIG_PATH: DOTENV_PROD,
        MESSAGES_DIR: '/root/royal-tv/messages'
      },
      time: true,
      max_restarts: 10,
      autorestart: true
    }
  ]
};
