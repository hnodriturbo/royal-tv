// 🌟 PM2 Ecosystem Config for Royal TV (ESM format)
export default {
  apps: [
    {
      name: 'royal-tv-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/royal-tv',
      env: {
        NODE_ENV: 'production'
      },
      node_args: '-r dotenv/config' // 📦 Preload dotenv to load .env file
    },
    {
      name: 'royal-tv-socket',
      script: 'node',
      args: 'server.js',
      cwd: '/root/royal-tv',
      env: {
        NODE_ENV: 'production'
      },
      node_args: '-r dotenv/config' // 🔌 Preload .env for socket server
    }
  ]
};
