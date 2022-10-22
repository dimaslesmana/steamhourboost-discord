const fs = require('fs');
const path = require('path');
const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const environments = require('../environments');

const CLIENT_ID = environments.DISCORD_CLIENT_ID;
const TOKEN = environments.DISCORD_BOT_TOKEN;
const GUILD_ID = environments.DISCORD_GUILD_ID;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    const args = process.argv.slice(2);
    const isGlobal = args.includes('--global');

    if (isGlobal) {
      // Register global commands
      console.info('Started refreshing global application (/) commands.');

      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: [] },
      );

      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands },
      );

      console.info('Successfully reloaded global application (/) commands.');
    } else {
      // Register guild-specific commands
      console.info('Started refreshing guild application (/) commands.');

      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [] },
      );

      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
      );

      console.info('Successfully reloaded guild application (/) commands.');
    }
  } catch (error) {
    console.error(error);
  }
})();
