/**
 * ecosystem.config.cjs
 * --------------------
 * PM2 configuration for Royal TV
 * - Runs frontend (Next.js build) and socket server
 */
module.exports = {
  apps: [
    {
      name: 'royal-tv-frontend', // 🌐 Next.js frontend
      script: 'npm',
      args: 'start',
      cwd: '/root/royal-tv', // 👈 project directory
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'royal-tv-socket', // 📡 Socket.IO backend
      script: 'node',
      args: 'server/socketServer.js',
      cwd: '/root/royal-tv', // 👈 project directory
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
