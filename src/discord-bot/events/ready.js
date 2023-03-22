const { ActivityType } = require('discord.js');
const { steamBots } = require('../../steam-bot');
const SteamBot = require('../../steam-bot/steam-bot');
const SteamAccount = require('../../services/steam-account.service');

const { logger } = require('../../helpers/logger.helper');

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
};

// * Restart all Steam accounts that are running before the bot was restarted
const restartAllRunning = async (client) => {
  try {
    const steamAccounts = await SteamAccount.getAllRunning();

    if (!steamAccounts.length) {
      return;
    }

    logger.info(`Found ${steamAccounts.length} running Steam accounts. Restarting...`);

    for (const steamAccount of steamAccounts) {
      const steamBot = steamBots.find((bot) => bot.getUsername() === steamAccount.username && (bot.isRunning() || steamAccount.isRunning));

      if (steamBot) {
        continue;
      }

      const newSteamBot = new SteamBot(steamAccount, client);

      // Delay the restart of each Steam account by 5 seconds
      setTimeout(() => {
        steamBots.push(newSteamBot);
        newSteamBot.start();
      }, 5000);
    }

    logger.info('Restarted all running Steam accounts.');
  } catch (error) {
    logger.error(error);
  }
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

      await restartAllRunning(client);
    } catch (error) {
      logger.error(error);
    }
  },
};