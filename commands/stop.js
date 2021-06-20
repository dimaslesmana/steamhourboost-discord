const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'stop',
  description: 'Stop Steam account.',
  async execute(client, prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    if (!verifyArgs(args, 'start-stop')) return;

    try {
      // Get Steam account from db
      const steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username: args[0] });

      if (!steamAccount.length) return;

      if (!steamAccount[0].is_running) {
        client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${steamAccount[0].username} | Account already stopped!`);
        return;
      }

      // Get Steam account index from array
      const index = steamAccounts.map(account => account.steamClient.id).indexOf(steamAccount[0].id);

      // index not found
      if (index <= -1) {
        // Update is_runnning status in database
        await knex(db.table.steam).where({ owner_id: user[0].id, username: args[0] }).update({ is_running: false });
        client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${steamAccount[0].username} | Account stopped!`);
        return;
      }

      steamAccounts[index].steamClient.doLogOff(index);
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      client.users.cache.get(user[0].discord_id).send("Oops! Something went wrong.");
      return;
    }
  }
};