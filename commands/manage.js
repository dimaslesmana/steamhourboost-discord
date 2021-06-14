const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

module.exports = {
  name: 'manage',
  description: 'Manage specified Steam account.',
  async execute(client, prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    if (!verifyArgs(args, 'manage')) {
      message.reply(
        "\n**Steam-HourBoost | Manage**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.manage} games \`username\` \`appid\`:** Add list of games to be played.` +
        "\n" + `**${prefix}${commands.manage} onlinestatus \`username\` \`(true/false)\`:** Change Steam online status.` +
        "\n" +
        "\n" + `If multiple AppID provided, seperate with \`,\`` +
        "\n" + `**Example: 730,440*` +
        "\n" + "---------------------------------"
      );
      return;
    }

    try {
      const manageCommand = args[0];

      // Check if username exist
      const steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username: args[1] });

      if (!steamAccount.length) {
        message.reply("Username does not exist!");
        return;
      }

      switch (manageCommand) {
        case 'games':
          const games = args[2].split(",");

          for (let i = 0; i < games.length; i++) {
            // return if games is not a number
            if (!games[i].match(/^[0-9]+$/g)) {
              return;
            }
          }

          // Update games to database
          await knex(db.table.steam).where({ owner_id: user[0].id, username: args[1] }).update({ games });

          message.reply(`${games.length} games added!`);
          break;
        case 'onlinestatus':
          let status = args[2].toLowerCase();

          if (status !== "true" && status !== "false") return;

          const onlineStatus = (status === "true") ? true : false;

          // Update online status
          await knex(db.table.steam).where({ owner_id: user[0].id, username: args[1] }).update({ onlinestatus: onlineStatus });

          message.reply(`Online status changed to ${onlineStatus}!`);
          break;
      }
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.reply("Oops! Something went wrong.");
      return;
    }
  }
};