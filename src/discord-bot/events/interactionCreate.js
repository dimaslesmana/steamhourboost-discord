const { logger } = require('../../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    // Skip if interaction is sent from guild
    if (interaction.guildId) {
      return;
    }

    // Skip if interaction is sent from a bot
    if (interaction.user.bot) {
      return;
    }

    const channelName = interaction.channel?.name ? `#${interaction.channel.name}` : 'DM';

    logger.info(`${interaction.user.tag} in ${channelName} used command: ${interaction.commandName}`);

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  },
};
