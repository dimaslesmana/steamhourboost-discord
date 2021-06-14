const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

// Category ID for "SHB-LICENSE"
const shbLicenseCategoryId = "839120441049743370";

module.exports = {
  name: 'license',
  description: 'See more about this command.',
  async execute(prefix, commands, message, args, user = []) {
    if (!verifyArgs(args, 'license')) {
      message.reply(
        "\n**Steam-HourBoost | License**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.license} add \`code\`:** Activate new license.` +
        "\n" + `**${prefix}${commands.license} change \`code\`:** Change your license.` +
        "\n" + "---------------------------------"
      );
      return;
    }

    try {
      const code = args[1];

      // Check if license code is found in database
      const licenseCode = await knex(db.table.license_code).where({ code: code, used_by: null });

      if (!licenseCode.length) {
        message.reply("License code invalid!");
        return;
      }

      // Get license type
      const licenseType = await knex(db.table.license_type).where({ type_id: licenseCode[0].type });

      const licenseCommand = args[0];

      if (licenseCommand === "add") {
        // Check if user already exist
        // if so, then don't allow them to use this command
        if (user.length) {
          message.reply("Only one license per account is allowed!");
          return;
        }

        // Handle add new license key
        // Insert new user to database
        await knex(db.table.discord).insert({ discord_id: message.author.id, account_type: licenseType[0].type_id });

        // Get new registered user from database
        user = await knex(db.table.discord).where({ discord_id: message.author.id });

        // Change license used_by status to new user id
        await knex(db.table.license_code).where({ code: code }).update({ used_by: user[0].id });

        const everyoneRole = message.guild.roles.cache.find(r => r.name === "@everyone");

        // Create text channel based on license code
        await message.guild.channels.create(message.author.id, {
          type: 'text',
          parent: shbLicenseCategoryId,
          topic: `License code: ${code} | (${licenseType[0].description})`,
          permissionOverwrites: [
            {
              id: message.author.id,
              allow: ['VIEW_CHANNEL']
            },
            {
              id: everyoneRole.id,
              deny: ['VIEW_CHANNEL']
            }
          ]
        });

        message.reply(`License activation successful!\nLicense type: ${licenseType[0].description}`);
      } else if (licenseCommand === "change") {
        // Handle license key change

        // return if user is not found
        if (!user.length) return;

        // Get old license
        const oldLicense = await knex(db.table.license_code).where({ used_by: user[0].id });
        // Delete old license
        await knex(db.table.license_code).where({ code: oldLicense[0].code }).del();

        // Update user account and license type
        await knex(db.table.discord).where({ id: user[0].id }).update({ account_type: licenseType[0].type_id });
        await knex(db.table.license_code).where({ code: code }).update({ used_by: user[0].id });

        const channel = message.guild.channels.cache.find(channel => channel.name === message.author.id && channel.type === 'text');

        channel.setTopic(`License code: ${code} | (${licenseType[0].description})`);

        message.reply(`License changed!\nLicense type: ${licenseType[0].description}`);
      }
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      message.reply("Oops! Something went wrong.");
      return;
    }
  }
};