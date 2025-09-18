module.exports = {
  apps: [
    {
      name: 'royal-tv-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/royal-tv',
      env: {
        NODE_ENV: 'production',
        MESSAGES_DIR: '/root/royal-tv/src/messages'
      },
      node_args: '-r dotenv/config'
    },
    {
      name: 'royal-tv-backend',
      script: 'node',
      args: 'server.js',
      cwd: '/root/royal-tv',
      env: {
        NODE_ENV: 'production',
        MESSAGES_DIR: '/root/royal-tv/src/messages'
      },
      node_args: '-r dotenv/config'
    }
  ]
};
