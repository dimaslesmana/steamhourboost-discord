const { knex, db } = require('../helpers/database');
const log = require('../helpers/logger');
const env = require('../helpers/load-env');

const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'restart-boost',
  description: 'Restart steam account that has running status on db set to true (Admin only).',
  async execute(prefix, commands, message, args, user = []) {
    // check if sender is admin
    if (message.author.id !== env.DISCORD_ADMIN_ID()) return;

    try {
      // Get Steam accounts from db where running status is true
      const accounts = await knex(db.table.steam).where({ is_running: true });

      if (!accounts.length) {
        message.reply("No account found!");
        return;
      }

      // Parse games array from string to integer
      accounts.forEach(account => {
        account.games = account.games.map(game => parseInt(game));
      });

      accounts.forEach(account => {
        // Check if steam account already exist in array
        const isExists = steamAccounts.find(acc => acc.steamClient.username === account.username);

        if (!isExists) {
          setTimeout(() => {
            const client = steamBots.new(account);
            client.doLogin();

            steamAccounts.push({
              steamClient: client,
              discordClient: {
                message: message
              }
            });
          }, 3 * 1000);
        }
      });

      message.reply(`SUCCESS`);
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.reply("Oops! Something went wrong.");
      return;
    }
  }
};