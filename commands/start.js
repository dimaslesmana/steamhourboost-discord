const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'start',
  description: 'Start Steam account.',
  async execute(client, prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    if (!verifyArgs(args, 'start-stop')) return;

    try {
      // Get Steam account from db
      const steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username: args[0] });

      if (!steamAccount.length) return;

      if (steamAccount[0].is_running) {
        message.author.send(`${log('discord')} ${steamAccount[0].username} | Account already running!`);
        return;
      }

      // Parse games array from string to integer
      steamAccount[0].games = steamAccount[0].games.map(game => parseInt(game));

      const client = steamBots.new(steamAccount[0]);
      message.author.send(`${log('discord')} ${steamAccount[0].username} | Sending login request into Steam - Please wait...`);
      client.doLogin();

      steamAccounts.push({
        steamClient: client,
        discordClient: {
          message: message
        }
      });
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.author.send("Oops! Something went wrong.");
      return;
    }
  }
};