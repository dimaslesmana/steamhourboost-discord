const { SlashCommandBuilder } = require('discord.js');
const { steamBots } = require('../../steam-bot');
const SteamBot = require('../../steam-bot/steam-bot');
const SteamAccount = require('../../services/steam-account.service');
const DiscordAccount = require('../../services/discord-account.service');
const LicenseCode = require('../../services/license-code.service');
const { encrypt } = require('../../helpers/crypto');
const switchFn = require('../../utils/switch-function.util');
const { LicenseType } = require('../../types');
const { logger } = require('../../helpers/logger.helper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boost')
    .setDescription('Boosts a Steam account')
    .addSubcommand((subcommand) =>
      subcommand.setName('add')
        .setDescription('Add new Steam account to boost')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true))
        .addStringOption((option) => option.setName('password').setDescription('Steam password').setRequired(true))
        .addStringOption((option) => option.setName('shared_secret').setDescription('Steam shared secret')))
    .addSubcommand((subcommand) =>
      subcommand.setName('list')
        .setDescription('List all available Steam accounts'))
    .addSubcommand((subcommand) =>
      subcommand.setName('steam-guard')
        .setDescription('Set Steam Guard code for specific Steam account')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true))
        .addStringOption((option) => option.setName('code').setDescription('Steam Guard code').setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand.setName('start')
        .setDescription('Start boosting specific Steam account')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand.setName('restart')
        .setDescription('Restart boosting (include username to restart specific account).')
        .addStringOption((option) => option.setName('username').setDescription('Steam username')))
    .addSubcommand((subcommand) =>
      subcommand.setName('stop')
        .setDescription('Stop boosting specific Steam account')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand.setName('remove')
        .setDescription('Remove specific Steam account')
        .addStringOption((option) => option.setName('username').setDescription('Steam username').setRequired(true))),
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
        'add': async () => {
          try {
            const license = await LicenseCode.getCodeById(user.licenseCodeId);
            const steamAccounts = await SteamAccount.getAll(discordId);

            if (license.licenseType.id === LicenseType.Free && steamAccounts.length >= 1) {
              await interaction.reply('You can only add up to 1 account for free license.');
              return;
            }

            const data = {
              username: interaction.options.getString('username'),
              password: encrypt(interaction.options.getString('password')),
              loginKey: '',
              sharedSecret: encrypt(interaction.options.getString('shared_secret')),
              games: JSON.stringify([]),
              discordOwnerId: discordId,
            };

            // Check if Steam account already exists
            const account = await SteamAccount.getAccount(discordId, data.username);

            if (account) {
              await interaction.reply('Steam account already exists.');
              return;
            }

            await SteamAccount.insert(data);
            await interaction.reply('Successfully added new Steam account!');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to add new Steam account.');
          }
        },
        'list': async () => {
          try {
            const accounts = await SteamAccount.getAll(discordId);

            if (!accounts.length) {
              await interaction.reply('No Steam accounts found.');
              return;
            }

            let message = '**Available Steam accounts**';
            message += '\n----------------------------------------';

            for (const [i, account] of accounts.entries()) {
              message += `\n**${i + 1}. ${account.username}**`;
              message += `\n**Games (${JSON.parse(account.games).length}):** ${account.games}`;
              message += `\n**Status:** ${account.isRunning ? 'Running' : 'Stopped'}`;
              message += '\n----------------------------------------';
            }

            await interaction.client.functions.sendDM(discordId, message);
            await interaction.reply('Account list sent to your DM.');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to get Steam accounts.');
          }
        },
        'steam-guard': async () => {
          try {
            const steamUsername = interaction.options.getString('username');
            const code = interaction.options.getString('code');

            const steamAccount = await SteamAccount.getAccount(discordId, steamUsername);

            if (!steamAccount) {
              await interaction.reply('Steam account not found.');
              return;
            }

            const steamBot = steamBots.find((bot) => bot.getUsername() === steamUsername);

            if (!steamBot) {
              await interaction.reply('Steam account not found.');
              return;
            }

            await steamBot.inputSteamGuardCode(code);
            await interaction.reply('Successfully set Steam Guard code.');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to set Steam Guard code.');
          }
        },
        'start': async () => {
          try {
            const steamUsername = interaction.options.getString('username');
            const steamAccountData = await SteamAccount.getAccount(discordId, steamUsername);

            if (!steamAccountData) {
              await interaction.reply('Steam account not found!');
              return;
            }

            // Check if Steam account is already being boosted
            const steamBotRunning = steamBots.find((bot) => bot.getUsername() === steamAccountData.username && bot.isRunning());

            if (steamBotRunning) {
              await interaction.reply('Steam account is already being boosted!');
              return;
            }

            steamAccountData.games = JSON.parse(steamAccountData.games);
            const steamBot = new SteamBot(steamAccountData, interaction.client);
            const steamBotExist = steamBots.find((bot) => bot.getUsername() === steamBot.getUsername());

            if (!steamBotExist) {
              steamBots.push(steamBot);
            }

            steamBot.doLogin();

            await interaction.reply('Boost request sent! Please wait for the account to log in.');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to start boosting Steam account.');
          }
        },
        'restart': async () => {
          try {
            const steamUsername = interaction.options.getString('username');

            // * Restart specific Steam account
            if (steamUsername) {
              const steamAccountData = await SteamAccount.getAccount(discordId, steamUsername);

              if (!steamAccountData) {
                await interaction.reply('Steam account not found!');
                return;
              }

              const steamBot = steamBots.find((bot) => bot.getUsername() === steamAccountData.username && bot.isRunning());

              if (!steamBot) {
                await interaction.reply('Steam account is not being boosted!');
                return;
              }

              steamBot.setOnlineStatus(steamAccountData.onlineStatus);
              steamBot.setGames(JSON.parse(steamAccountData.games));

              // Tell the method below to not do the encryption
              // since it's already encrypted
              steamBot.setLoginKey(steamAccountData.loginKey, false);
              steamBot.setSharedSecret(steamAccountData.sharedSecret, false);

              steamBot.restart();

              await interaction.reply(`Restart request sent to ${steamUsername}! Please wait for the account to restart.`);
              return;
            }

            // * Restart all Steam accounts being boosted owned by the discord user
            const steamAccountsData = await SteamAccount.getAll(discordId);

            if (!steamAccountsData.length) {
              await interaction.reply('No Steam accounts found!');
              return;
            }

            let count = 0;

            for (const steamAccountData of steamAccountsData) {
              const steamBot = steamBots.find((bot) => bot.getUsername() === steamAccountData.username && bot.isRunning());

              if (!steamBot) {
                continue;
              }

              steamBot.setOnlineStatus(steamAccountData.onlineStatus);
              steamBot.setGames(JSON.parse(steamAccountData.games));

              // Tell the method below to not do the encryption
              // since it's already encrypted
              steamBot.setLoginKey(steamAccountData.loginKey, false);
              steamBot.setSharedSecret(steamAccountData.sharedSecret, false);

              steamBot.restart();

              count++;
            }

            if (!count) {
              await interaction.reply('No Steam accounts are being boosted!');
              return;
            }

            await interaction.reply('Restart request sent to all Steam accounts! Please wait for the accounts to restart.');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to restart boosting Steam account.');
          }
        },
        'stop': async () => {
          try {
            const steamUsername = interaction.options.getString('username');

            const steamAccountData = await SteamAccount.getAccount(discordId, steamUsername);

            if (!steamAccountData) {
              await interaction.reply('Steam account not found!');
              return;
            }

            const steamBot = steamBots.find((bot) => bot.getUsername() === steamAccountData.username && bot.isRunning());

            if (!steamBot) {
              await interaction.reply('Steam account is not being boosted!');
              return;
            }

            steamBot.doLogOff();
            await interaction.reply('Stop request sent! Please wait for the account to log off.');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to stop boosting Steam account.');
          }
        },
        'remove': async () => {
          try {
            const steamUsername = interaction.options.getString('username');
            const steamAccountData = await SteamAccount.getAccount(discordId, steamUsername);

            if (!steamAccountData) {
              await interaction.reply('Steam account not found!');
              return;
            }

            const steamBot = steamBots.find((bot) => bot.getUsername() === steamAccountData.username && bot.isRunning());

            if (steamBot) {
              steamBot.doLogOff(true);
              steamBots.splice(steamBots.indexOf(steamBot), 1);
            }

            await SteamAccount.remove(steamUsername);
            await interaction.reply('Successfully removed Steam account!');
          } catch (error) {
            logger.error(error?.message ?? error);
            await interaction.reply('Failed to remove Steam account.');
          }
        },
      };

      switchFn(commands, 'default')(subcommand);
    } catch (error) {
      logger.error(error);
    }
  },
};
