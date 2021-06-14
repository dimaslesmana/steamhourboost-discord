const { knex, db } = require('../helpers/database');
const log = require('../helpers/logger');

module.exports = {
  name: 'list',
  description: 'List of your accounts.',
  async execute(prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    let msg = "";
    let number = 1;

    msg += "\n**Account List**";
    msg += "\n---------------------------------\n";

    try {
      const steamAccounts = await knex(db.table.steam).where({ owner_id: user[0].id });
      steamAccounts.forEach(account => {
        msg += `${number++}. **${account.username}** - Running: \`${account.is_running}\``;
        msg += "\n";
      });

      if (!steamAccounts.length) {
        message.reply("No accounts found!");
        return;
      }

      message.reply(msg);
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.reply("Oops! Something went wrong.");
      return;
    }
  }
};