// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'royal-tv-front',
      cwd: '/root/royal-tv',
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork', // 🚀 Next.js frontend (single instance)
      instances: 1,
      env: {
        NODE_ENV: 'production',
        DOTENV_CONFIG_PATH: '/root/royal-tv/.env' // 🔧 Load all env vars from .env
      },
      node_args: '-r dotenv/config'
    },
    {
      name: 'royal-tv-socket',
      cwd: '/root/royal-tv',
      script: 'npm',
      args: 'run server:start',
      exec_mode: 'fork', // 🔌 Socket.IO/Express backend
      instances: 1,
      env: {
        NODE_ENV: 'production',
        DOTENV_CONFIG_PATH: '/root/royal-tv/.env' // 🔧 Load all env vars from .env
      },
      node_args: '-r dotenv/config'
    }
  ]
};
