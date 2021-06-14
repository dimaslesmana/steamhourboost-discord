const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'stop',
  description: 'Stop specified Steam account.',
  async execute(prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    if (!verifyArgs(args, 'start-stop')) return;

    try {
      // Get Steam account from db
      const steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username: args[0] });

      if (!steamAccount.length) return;

      if (!steamAccount[0].is_running) {
        message.reply("Steam acccount already stopped!");
        return;
      }

      // Get Steam account index from array
      const index = steamAccounts.map(account => account.steamClient.id).indexOf(steamAccount[0].id);

      // index not found
      if (index <= -1) {
        // Update is_runnning status in database
        await knex(db.table.steam).where({ owner_id: user[0].id, username: args[0] }).update({ is_running: false });
        message.reply("Steam account stopped!");
        return;
      }

      steamAccounts[index].steamClient.doLogOff();
      // Remove Steam account from array
      steamAccounts.splice(index, 1);

      message.reply("Steam acccount stopped!");
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.reply("Oops! Something went wrong.");
      return;
    }
  }
};