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
          steamAccounts[index].steamClient.doLogOff(index);
        } else {
          // index not found
          await knex(db.table.steam).where({ owner_id: user[0].id, username }).update({ is_running: false });
          client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${username} | Account stopped!`);
        }

        // Login
        // Parse games array from string to integer
        steamAccount[0].games = steamAccount[0].games.map(game => parseInt(game));

        const steamClient = steamBots.new(steamAccount[0]);
        steamClient.doLogin();

        steamAccounts.push({
          steamClient,
          discordClient: client
        });
        return;
      }

      // * Restart all steam account
      // Get Steam accounts from db
      const accounts = await knex(db.table.steam).where({ owner_id: user[0].id, is_running: true });

      if (!accounts.length) {
        client.users.cache.get(user[0].discord_id).send(`${log('discord')} No running account found!`);
        return;
      }

      const totalAccountMsg = `${accounts.length} running ${(accounts.length > 1) ? 'accounts' : 'account'}`;
      client.users.cache.get(user[0].discord_id).send(`${log('discord')} Found ${totalAccountMsg} - Restarting ${totalAccountMsg}...`);

      // Parse games array from string to integer
      accounts.forEach(account => {
        account.games = account.games.map(game => parseInt(game));
      });

      // Logout all accounts
      accounts.forEach(async account => {
        //  Get Steam account index from array
        const index = steamAccounts.map(acc => acc.steamClient.id).indexOf(account.id);

        if (index >= 0) {
          steamAccounts[index].steamClient.doLogOff(index);
        } else {
          // index not found
          await knex(db.table.steam).where({ owner_id: user[0].id, username: account.username }).update({ is_running: false });
          client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${account.username} | Account stopped!`);
        }
      });

      // Login all accounts
      accounts.forEach(account => {
        setTimeout(() => {
          const steamClient = steamBots.new(account);
          steamClient.doLogin();

          steamAccounts.push({
            steamClient,
            discordClient: client
          });
        }, 5 * 1000);
      });
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      client.users.cache.get(user[0].discord_id).send("Oops! Something went wrong.");
      return;
    }
  }
};