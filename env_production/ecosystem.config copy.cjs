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
 *
 * 📦 Files:
 *   • /root/royal-tv/.env            → holds MESSAGES_DIR and all secrets
 *   • /root/royal-tv/messages/{en,is}.json
 *
 * 📝 Notes:
 *   • Changing any NEXT_PUBLIC_* requires:
 *       rm -rf .next && npm run build && pm2 restart royal-tv-frontend
 *   • Server-only env changes:
 *       pm2 restart royal-tv-backend
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
        DOTENV_CONFIG_PATH: DOTENV_PROD // 📌 tell dotenv which .env file to load
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
        DOTENV_CONFIG_PATH: DOTENV_PROD // 📌 same .env file
      },
      time: true,
      max_restarts: 10,
      autorestart: true
    }
  ]
};
