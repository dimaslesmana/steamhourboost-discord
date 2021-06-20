const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'restart',
  description: 'Restart running Steam account.',
  async execute(client, prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    if (!verifyArgs(args, 'restart')) return;

    try {
      // * Restart specific steam account
      if (args.length) {
        // Get Steam account from db
        const steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username: args[0], is_running: true })

        // no steam account found
        if (!steamAccount.length) return;

        const username = steamAccount[0].username;

        // Logout
        const index = steamAccounts.map(account => account.steamClient.id).indexOf(steamAccount[0].id);

        if (index >= 0) {
          message.author.send(`${log('discord')} ${username} | Sending logout request into Steam - Please wait...`);
          steamAccounts[index].steamClient.doLogOff(index);
        } else {
          // index not found
          await knex(db.table.steam).where({ owner_id: user[0].id, username }).update({ is_running: false });
          message.author.send(`${log('discord')} ${username} | Account stopped!`);
        }

        // Login
        // Parse games array from string to integer
        steamAccount[0].games = steamAccount[0].games.map(game => parseInt(game));

        const client = steamBots.new(steamAccount[0]);
        message.author.send(`${log('discord')} ${username} | Sending login request into Steam - Please wait...`);
        client.doLogin();

        steamAccounts.push({
          steamClient: client,
          discordClient: {
            message: message
          }
        });
        return;
      }

      // * Restart all steam account
      // Get Steam accounts from db
      const accounts = await knex(db.table.steam).where({ owner_id: user[0].id, is_running: true });

      if (!accounts.length) {
        message.author.send(`${log('discord')} No running account found!`);
        return;
      }

      const totalAccountMsg = `${accounts.length} running ${(accounts.length > 1) ? 'accounts' : 'account'}`;
      message.author.send(`${log('discord')} Found ${totalAccountMsg} - Restarting ${totalAccountMsg}...`);

      // Parse games array from string to integer
      accounts.forEach(account => {
        account.games = account.games.map(game => parseInt(game));
      });

      // Logout all accounts
      accounts.forEach(async account => {
        //  Get Steam account index from array
        const index = steamAccounts.map(acc => acc.steamClient.id).indexOf(account.id);

        if (index >= 0) {
          message.author.send(`${log('discord')} ${account.username} | Sending logout request into Steam - Please wait...`);
          steamAccounts[index].steamClient.doLogOff(index);
        } else {
          // index not found
          await knex(db.table.steam).where({ owner_id: user[0].id, username: account.username }).update({ is_running: false });
          message.author.send(`${log('discord')} ${account.username} | Account stopped!`);
        }
      });

      // Login all accounts
      accounts.forEach(account => {
        setTimeout(() => {
          const client = steamBots.new(account);
          message.author.send(`${log('discord')} ${account.username} | Sending login request into Steam - Please wait...`);
          client.doLogin();

          steamAccounts.push({
            steamClient: client,
            discordClient: {
              message: message
            }
          });
        }, 5 * 1000);
      });
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.author.send("Oops! Something went wrong.");
      return;
    }
  }
};