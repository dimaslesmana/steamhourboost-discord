const { SlashCommandBuilder } = require('discord.js');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);
const environments = require('../../environments');
const LicenseCode = require('../../services/license-code.service');
const switchFn = require('../../helpers/switch-function');
const { LicenseType } = require('../../types');
const { logger } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin only commands')
    .setDefaultMemberPermissions(0)
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup.setName('license')
        .setDescription('License commands')
        .addSubcommand((subcommand) =>
          subcommand.setName('generate')
            .setDescription('Generate new license key')
            .addStringOption((option) =>
              option.setName('type')
                .setDescription('License type')
                .setRequired(true)
                .addChoices(
                  { name: 'Free', value: LicenseType.Free },
                  { name: 'Premium', value: LicenseType.Premium },
                ))
            .addIntegerOption((option) => option.setName('amount').setDescription('Amount of keys to generate').setRequired(true)))),
  async execute(interaction) {
    try {
      const discordId = interaction.user.id;
      const subcommand = interaction.options.getSubcommand();

      if (discordId !== environments.DISCORD_ADMIN_ID) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
      }

      const commands = {
        'generate': async () => {
          try {
            const licenseType = interaction.options.getString('type');
            const licenseTypeName = (licenseType === LicenseType.Free) ? 'Free' : 'Premium';
            const amount = interaction.options.getInteger('amount');

            const licenseKeys = [];

            for (let i = 0; i < amount; i++) {
              // Generate new license key using nanoid and separate by dashes
              const licenseKey = nanoid().match(/.{1,4}/g).join('-');

              licenseKeys.push(licenseKey);
            }

            // Insert new license keys into database
            await LicenseCode.insert(licenseKeys, licenseType);

            let licenseKeyMsg = '';
            for (const licenseKey of licenseKeys) {
              licenseKeyMsg += `- License key: \`${licenseKey}\` **(${licenseTypeName})**\n`;
            }

            await interaction.reply(`**Generated ${amount} license key(s)**\n${licenseKeyMsg}`);
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply({ content: 'Failed to generate license key.', ephemeral: true });
          }
        },
      };

      switchFn(commands, 'default')(subcommand);
    } catch (error) {
      logger.error(error);
    }
  },
};
