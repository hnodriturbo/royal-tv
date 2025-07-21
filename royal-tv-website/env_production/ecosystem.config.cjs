// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'royal-tv-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/royal-tv',
      env: { NODE_ENV: 'production' },
      node_args: '-r dotenv/config'
    },
    {
      name: 'royal-tv-backend',
      script: 'node',
      args: 'server.js',
      cwd: '/root/royal-tv',
      env: { NODE_ENV: 'production' },
      node_args: '-r dotenv/config'
    }
  ]
};
