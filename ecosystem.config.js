module.exports = {
  apps: [
    {
      name: 'steamhourboost-discord',
      script: './src/discord-bot/index.js',
      watch: true,
      ignore_watch: [
        'node_modules',
        '.git',
        'accounts-data/*',
        'logs/*',
        'src/db/*.db',
        'src/prisma/migrations',
      ],
      autorestart: true,
      time: true,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
