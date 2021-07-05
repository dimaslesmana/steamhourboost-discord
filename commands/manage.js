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
      client.users.cache.get(user[0].discord_id).send(
        "\n**Steam-HourBoost | Manage**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.manage} games \`username\` \`appid\`:** Add list of games to be played.` +
        "\n" + `**${prefix}${commands.manage} onlinestatus \`username\` \`(true/false)\`:** Change Steam online status.` +
        "\n" +
        "\n" + `If multiple AppID provided, seperate with \`,\`` +
        "\n" + `*\* Example: 730,440*` +
        "\n" + "---------------------------------"
      );
      return;
    }

    try {
      const manageCommand = args[0];
      const username = args[1];

      // Check if username exist
      const steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username });

      if (!steamAccount.length) {
        client.users.cache.get(user[0].discord_id).send(`${log('discord')} Username \`${username}\` does not exist!`);
        return;
      }

      switch (manageCommand) {
        case 'games':
          // * Make sure games appid are unique
          const gamesAppId = args[2].split(",");
          const games = [...new Set(gamesAppId)];

          // * Games amount should not be higher than 30
          if (games.length > 30) {
            client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${username} | Maximum is 30 games`);
            return;
          }

          if (games.length !== gamesAppId.length) {
            const duplicateCount = gamesAppId.length - games.length;
            client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${username} | ${duplicateCount} duplicate App ID found! - Duplicate removed!`);
          }

          for (let i = 0; i < games.length; i++) {
            // return if games is not a number
            if (!games[i].match(/^[0-9]+$/g)) {
              return;
            }
          }

          // Update games to database
          await knex(db.table.steam).where({ owner_id: user[0].id, username }).update({ games });

          client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${username} | ${games.length} games added!`);
          break;
        case 'onlinestatus':
          let status = args[2].toLowerCase();

          if (status !== "true" && status !== "false") return;

          const onlineStatus = (status === "true") ? true : false;

          // Update online status
          await knex(db.table.steam).where({ owner_id: user[0].id, username }).update({ onlinestatus: onlineStatus });

          client.users.cache.get(user[0].discord_id).send(`${log('discord')} ${username} | Online status changed to \`${(onlineStatus) ? 'Online' : 'Invisible'}\`!`);
          break;
      }
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      client.users.cache.get(user[0].discord_id).send("Oops! Something went wrong.");
      return;
    }
  }
};