/**
 * /ecosystem.config.cjs
 * ---------------------
 * 🧭 PM2 apps:
 *   • royal-tv-frontend → Next.js prod server (port 3000)
 *   • royal-tv-backend  → server.js (Socket.IO + /emit/* + /health, port 3001)
 *
 * 🧪 Env loading:
 *   • Dotenv preloaded for BOTH apps via interpreter_args.
 *   • DOTENV_CONFIG_PATH points to /root/royal-tv/.env (single source of truth).
 *   • MESSAGES_DIR explicitly set here for consistency.
 *
 * 📦 Files:
 *   • /root/royal-tv/.env
 *   • /root/royal-tv/messages/{en,is}.json
 */

const path = require('path');

// 🔐 Absolute path to production .env file
const DOTENV_PROD = path.join(__dirname, '.env');

module.exports = {
  apps: [
    {
      name: 'royal-tv-frontend',
      // 🚀 Run Next.js directly so Node args apply (not "npm start")
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000', // 🌐 serve built app on port 3000
      cwd: '/root/royal-tv', // 📂 project root
      interpreter: 'node',
      interpreter_args: '-r dotenv/config', // 🧪 preload dotenv
      env: {
        NODE_ENV: 'production', // 🏭 prod mode
        DOTENV_CONFIG_PATH: DOTENV_PROD, // 📌 tell dotenv which .env file to load
        MESSAGES_DIR: '/root/royal-tv/messages' // 🌍 force messages dir for i18n
      },
      time: true, // ⏱️ timestamps in PM2 logs
      max_restarts: 10, // 🔁 restart budget
      autorestart: true // 🔄 keep alive
    },
    {
      name: 'royal-tv-backend',
      // 📡 Backend (Socket.IO + /emit/* + /health)
      script: 'server.js',
      cwd: '/root/royal-tv', // 📂 project root
      interpreter: 'node',
      interpreter_args: '-r dotenv/config', // 🧪 preload dotenv
      env: {
        NODE_ENV: 'production', // 🏭 prod mode
        DOTENV_CONFIG_PATH: DOTENV_PROD, // 📌 same .env file
        MESSAGES_DIR: '/root/royal-tv/messages' // 🌍 same messages dir
      },
      time: true,
      max_restarts: 10,
      autorestart: true
    }
  ]
};
