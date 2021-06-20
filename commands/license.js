const { knex, db } = require('../helpers/database');
const verifyArgs = require('../helpers/verify-arguments');
const log = require('../helpers/logger');

// Category ID for "SHB-LICENSE"
// const shbLicenseCategoryId = "839120441049743370";

module.exports = {
  name: 'license',
  description: 'See more about this command.',
  async execute(client, prefix, commands, message, args, user = []) {
    if (!verifyArgs(args, 'license')) {
      client.users.cache.get(message.author.id).send(
        "\n**Steam-HourBoost | License**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.license} add \`code\`:** Activate new license.` +
        "\n" + `**${prefix}${commands.license} change \`code\`:** Change your license.` +
        "\n" + `**${prefix}${commands.license} info:** Show your license information.` +
        "\n" + "---------------------------------"
      );
      return;
    }

    try {
      const licenseCommand = args[0];

      if (licenseCommand === "info") {
        // return if user is not found
        if (!user.length) return;

        const licenseCode = await knex(db.table.license_code).where({ used_by: user[0].id });
        const licenseType = await knex(db.table.license_type).where({ type_id: licenseCode[0].type });

        client.users.cache.get(user[0].discord_id).send(`${log('discord')}\nLicense Code: \`${licenseCode[0].code}\`\nLicense Type: ${licenseType[0].description}`);
        return;
      }

      const code = args[1];

      // Check if license code is found in database
      const licenseCode = await knex(db.table.license_code).where({ code, used_by: null });

      if (!licenseCode.length) {
        client.users.cache.get(message.author.id).send(`${log('discord')} License code \`${code}\` invalid!`);
        return;
      }

      // Get license type
      const licenseType = await knex(db.table.license_type).where({ type_id: licenseCode[0].type });

      if (licenseCommand === "add") {
        // Check if user already exist
        // if so, then don't allow them to use this command
        if (user.length) {
          // client.users.cache.get(message.author.id).send("Only one license per account is allowed!");
          client.users.cache.get(message.author.id).send(`${log('discord')} License code \`${code}\` invalid!`);
          return;
        }

        // Handle add new license key
        // Insert new user to database
        await knex(db.table.discord).insert({ discord_id: message.author.id, account_type: licenseType[0].type_id });

        // Get new registered user from database
        user = await knex(db.table.discord).where({ discord_id: message.author.id });

        // Change license used_by status to new user id
        await knex(db.table.license_code).where({ code }).update({ used_by: user[0].id });

        // // Create text channel based on license code
        // const everyoneRole = message.guild.roles.cache.find(r => r.name === "@everyone");

        // await message.guild.channels.create(message.author.id, {
        //   type: 'text',
        //   parent: shbLicenseCategoryId,
        //   topic: `License code: ${code} | (${licenseType[0].description})`,
        //   permissionOverwrites: [
        //     {
        //       id: message.author.id,
        //       allow: ['VIEW_CHANNEL']
        //     },
        //     {
        //       id: everyoneRole.id,
        //       deny: ['VIEW_CHANNEL']
        //     }
        //   ]
        // });

        client.users.cache.get(user[0].discord_id).send(`${log('discord')}\nLicense activation successful!\nLicense type: ${licenseType[0].description}`);
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

        // // Edit channel topic when license changes
        // const channel = message.guild.channels.cache.find(channel => channel.name === message.author.id && channel.type === 'text');
        // channel.setTopic(`License code: ${code} | (${licenseType[0].description})`);

        client.users.cache.get(user[0].discord_id).send(`${log('discord')}\nLicense changed!\nLicense type: ${licenseType[0].description}`);
      }
    } catch (err) {
      console.log(`${log('discord')} ERROR | ${err}`);
      client.users.cache.get(message.author.id).send("Oops! Something went wrong.");
      return;
    }
  }
};