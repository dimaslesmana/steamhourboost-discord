const { ActivityType } = require('discord.js');
const SteamAccount = require('../../services/steam-account.service');

const { logger } = require('../../utils/logger');

const setBotStatus = (client) => {
  client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: '/help',
        type: ActivityType.Listening,
      },
    ],
  });

  logger.info('Bot status updated.');
};

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    try {
      logger.info(`Bot Ready! Logged in as ${client.user.tag}`);
      setBotStatus(client);

      // Set bot status every 10 minutes
      setInterval(() => {
        setBotStatus(client);
      }, 10 * 60 * 1000);

      SteamAccount.RestartAllRunning(client);
    } catch (error) {
      logger.error(error);
    }
  },
};