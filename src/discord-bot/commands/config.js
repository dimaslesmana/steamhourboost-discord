const { SlashCommandBuilder } = require('discord.js');
const DiscordAccount = require('../../services/discord-account.service');
const SteamAccount = require('../../services/steam-account.service');
const LicenseCode = require('../../services/license-code.service');
const { encrypt } = require('../../helpers/crypto');
const switchFn = require('../../utils/switch-function.util');
const { LicenseType } = require('../../types');
const { logger } = require('../../helpers/logger.helper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configures the Steam account')
    .addSubcommand((subcommand) =>
      subcommand.setName('games')
        .setDescription('Configure the games to boost for specific Steam account')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true))
        .addStringOption((option) => option.setName('games').setDescription('Separate multiple App IDs with a comma').setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand.setName('online-status')
        .setDescription('Configure the online status for specific Steam account')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true))
        .addBooleanOption((option) => option.setName('online').setDescription('Set online status').setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand.setName('shared-secret')
        .setDescription('Configure the shared secret for specific Steam account to be used for Steam Guard Authentication')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true))
        .addStringOption((option) => option.setName('shared_secret').setDescription('Steam shared secret'))),
  async execute(interaction) {
    try {
      const discordId = interaction.user.id;
      const subcommand = interaction.options.getSubcommand();

      const user = await DiscordAccount.getAccount(discordId);

      if (!user) {
        await interaction.reply('You are not registered yet. Use `/user register` to register your account.');
        return;
      }

      const commands = {
        'games': async () => {
          try {
            const steamUsername = interaction.options.getString('username');
            const games = interaction.options.getString('games');
            const steamAccount = await SteamAccount.getAccount(user.discordId, steamUsername);

            if (!steamAccount) {
              await interaction.reply('Steam account not found!');
              return;
            }

            if (!/^\d+(,\d+)*$/.test(games)) {
              await interaction.reply('Invalid App IDs format! Valid format: `730,440,570`');
              return;
            }

            const numberOfGames = games.split(',').length;

            // Limit number of games based on license type
            const license = await LicenseCode.getCodeById(user.licenseCodeId);

            if (license.licenseType.id === LicenseType.Free && numberOfGames > 1) {
              await interaction.reply('You can only add up to 1 game for free license.');
              return;
            }

            // Limit games to 30
            if (numberOfGames > 30) {
              await interaction.reply('You can only add up to 30 games.');
              return;
            }

            // Check for duplicate app id
            const appIds = games.split(',');
            const uniqueAppIds = [...new Set(appIds)];
            const duplicateAppIds = [];

            // Check duplicate app ids
            if (appIds.length !== uniqueAppIds.length) {
              const duplicate = appIds.filter((item, index) => appIds.indexOf(item) !== index);

              duplicateAppIds.push(...duplicate);
            }

            // Parse App IDs string to integer array
            const gamesArray = uniqueAppIds.map(Number);

            await SteamAccount.setGames(steamAccount.username, gamesArray);

            const duplicateMesage = (duplicateAppIds.length > 0) ? `**Duplicate App IDs:** \`${duplicateAppIds.join(',')}\`` : '**Duplicate App IDs:** `None`';

            await interaction.reply(`Successfully configured ${gamesArray.length} games for Steam account **${steamUsername}**!\n**Games:** \`${gamesArray.join(',')}\`\n${duplicateMesage}\n\nStart or Restart the boost to apply the changes.`);
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to configure games for Steam account.');
          }
        },
        'online-status': async () => {
          try {
            const steamUsername = interaction.options.getString('username');
            const onlineStatus = interaction.options.getBoolean('online');
            const steamAccount = await SteamAccount.getAccount(user.discordId, steamUsername);

            if (!steamAccount) {
              await interaction.reply('Steam account not found!');
              return;
            }

            await SteamAccount.setOnlineStatus(steamAccount.username, onlineStatus);

            await interaction.reply(`Successfully set online status to **${onlineStatus ? 'online' : 'offline'}** for Steam account **${steamUsername}**!\n\nStart or Restart the boost to apply the changes.`);
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to configure online status for Steam account.');
          }
        },
        'shared-secret': async () => {
          try {
            const steamUsername = interaction.options.getString('username');
            const sharedSecret = encrypt(interaction.options.getString('shared_secret'));
            const steamAccount = await SteamAccount.getAccount(user.discordId, steamUsername);

            if (!steamAccount) {
              await interaction.reply('Steam account not found!');
              return;
            }

            await SteamAccount.setSharedSecret(steamAccount.username, sharedSecret);

            await interaction.reply(`Successfully ${sharedSecret ? 'configured' : 'removed'} shared secret for Steam account **${steamUsername}**!\n\nStart or Restart the boost to apply the changes.`);
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to configure shared secret for Steam account.');
          }
        },
      };

      switchFn(commands, 'default')(subcommand);
    } catch (error) {
      logger.error(error);
    }
  },
};
