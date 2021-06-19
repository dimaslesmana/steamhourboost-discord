const { knex, db } = require('../helpers/database');
const { encrypt } = require('../helpers/crypto');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');
const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'account',
  description: 'See more about this command.',
  async execute(client, prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) return;

    if (!verifyArgs(args, 'account')) {
      message.author.send(
        "\n**Steam-HourBoost | Steam Account**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.account} add \`username\` \`password\` *(\`shared_secret\`)*:** Add new Steam account.` +
        "\n" + `**${prefix}${commands.account} edit \`username\` \`password\` *(\`shared_secret\`)*:** Edit specified Steam account.` +
        "\n" + `**${prefix}${commands.account} remove \`username\`:** Remove specified Steam account.` +
        "\n" +
        "\n" + `**Argument inside the bracket is optional.*` +
        "\n" + "---------------------------------"
      );
      return;
    }

    try {
      const accountCommand = args[0];
      let username = args[1].trim();

      let password = {
        iv: "",
        content: ""
      };

      if (args[2]) {
        password = encrypt(args[2]);
      }

      let sharedSecret = "";
      if (args[3]) {
        sharedSecret = args[3];
      }

      let steamAccount;
      let index;

      switch (accountCommand) {
        case 'add':
          // Add Steam account

          // Check account license type
          const accounts = await knex(db.table.steam).where({ owner_id: user[0].id });
          if (accounts.length) {
            if (user[0].account_type === 'L001' && accounts.length >= 1) {
              message.author.send("Only 1 account is allowed for free user!");
              return;
            }
          }

          // Check if username already exist
          const account = await knex(db.table.steam).where({ username });
          if (account.length) {
            message.author.send("Account already exist!");
            return;
          }

          // Insert account to database
          await knex(db.table.steam).insert({
            owner_id: user[0].id,
            username: username,
            password: [password.iv, password.content],
            sharedsecret: sharedSecret
          });

          message.author.send("Steam account added!");
          break;
        case 'edit':
          // Edit Steam account

          // Check if username exist
          steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username });

          if (!steamAccount.length) {
            message.author.send("Account does not exist!");
            return;
          }

          if (!sharedSecret) {
            sharedSecret = steamAccount[0].sharedsecret;
          }

          // Update account
          await knex(db.table.steam).where({ id: steamAccount[0].id, username }).update({ password: [password.iv, password.content], sharedsecret: sharedSecret });

          // Get Steam account index from array
          index = steamAccounts.map(account => account.steamClient.id).indexOf(steamAccount[0].id);

          // index found, user trying to edit account that is still running
          if (index >= 0) {
            steamAccounts[index].steamClient.doLogOff();
            // Remove Steam account from array
            steamAccounts.splice(index, 1);
            message.author.send("Steam account details edited!\nBoosting for this account has been stopped! Please restart boosting!");
            return;
          }

          message.author.send("Steam account details edited!");
          break;
        case 'remove':
          // Remove Steam account

          // Check if username exist
          steamAccount = await knex(db.table.steam).where({ owner_id: user[0].id, username });

          if (!steamAccount.length) {
            message.author.send("Account does not exist!");
            return;
          }

          await knex(db.table.steam).where({ owner_id: user[0].id, username }).del();

          // Get Steam account index from array
          index = steamAccounts.map(account => account.steamClient.id).indexOf(steamAccount[0].id);

          // index found, user trying to remove account that is still running
          if (index >= 0) {
            steamAccounts[index].steamClient.doLogOff();
            // Remove Steam account from array
            steamAccounts.splice(index, 1);
            message.author.send("Steam account removed!\nBoosting for this account has been stopped!");
            return;
          }

          message.author.send("Steam account removed!");
          break;
      }
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.author.send("Oops! Something went wrong.");
      return;
    }
  }
};