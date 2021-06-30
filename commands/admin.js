const serial = require("generate-serial-key");
const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');
const env = require('../helpers/load-env');
const { steamBots, steamAccounts } = require('../steamClient');

module.exports = {
  name: 'admin',
  description: 'Admin only commands.',
  async execute(client, prefix, commands, message, args, user = []) {
    // check if sender is admin
    if (message.author.id !== env.DISCORD_ADMIN_ID()) return;

    if (!verifyArgs(args, 'admin')) {
      client.users.cache.get(message.author.id).send(
        "\n**Steam-HourBoost | Admin Commands**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.admin} gen-license \`(free/premium)\` \`amount\`:** Generate new license.` +
        "\n" + `**${prefix}${commands.admin} restart-boost:** Restart steam account that has running status on db set to true. \*(Only use this after the bot exited or crashes)\*` +
        "\n" + "---------------------------------"
      );
      return;
    }

    const adminCommand = args[0];

    try {
      if (adminCommand === 'gen-license') {
        // too many arguments
        if (args.length > 3) return;

        // no license type provided
        if (!args[1]) return;
        const licenseType = args[1].toLowerCase();

        if (licenseType !== 'free' && licenseType !== 'premium') return;

        const licenseTypeId = {
          free: 'L001',
          premium: 'L002',
        };

        // set default license amount to 1
        let amount = 1;

        // check if license amount is provided and is numeric
        if (args[2]) {
          if (!args[2].match(/^[0-9]+$/g)) return;

          amount = parseInt(args[2]);
          amount = (amount <= 10) ? amount : 10;
        }

        const licenses = [];

        let msg = "";
        for (let i = 0; i < amount; i++) {
          const key = serial.generate();
          licenses.push({
            code: key,
            type: (licenseType === 'free') ? licenseTypeId.free : licenseTypeId.premium,
          });
        }

        licenses.forEach(license => msg += `License Code: \`${license.code}\` \*(${licenseType})\*\n`);

        // Insert licenses to database
        await knex.batchInsert(db.table.license_code, licenses, amount);

        client.users.cache.get(message.author.id).send(`${log('discord')}\n${msg}`);
      } else if (adminCommand === 'restart-boost') {
        // if (steamAccounts.length) {
        //   client.users.cache.get(message.author.id).send(`${log('discord')} Cannot continue, some steam account is still running!`);
        //   return;
        // }

        // Get Steam accounts from db where running status is true
        const accounts = await knex(db.table.steam).where({ is_running: true });

        if (!accounts.length) {
          client.users.cache.get(message.author.id).send(`${log('discord')} No account found!`);
          return;
        }

        const totalAccountMsg = `${accounts.length} ${(accounts.length > 1) ? 'accounts' : 'account'}`;
        client.users.cache.get(message.author.id).send(`${log('discord')} Found ${totalAccountMsg} - Restarting ${totalAccountMsg}...`);

        // Parse games array from string to integer
        accounts.forEach(account => {
          account.games = account.games.map(game => parseInt(game));
        });

        accounts.forEach(account => {
          // Check if steam account already exist in array
          const isExists = steamAccounts.find(acc => acc.steamClient.username === account.username);

          if (!isExists) {
            client.users.cache.get(message.author.id).send(`${log('discord')} ${account.username} | Sending login request into Steam - Please wait...`);
            setTimeout(() => {
              const steamClient = steamBots.new(account);
              steamClient.doLogin();

              steamAccounts.push({
                steamClient,
                discordClient: client
              });
            }, 2000);
          }
        });
      }
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      client.users.cache.get(message.author.id).send("Oops! Something went wrong.");
      return;
    }
  }
};