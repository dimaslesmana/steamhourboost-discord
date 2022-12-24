const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logger } = require('../../helpers/logger.helper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands'),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const helpEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('SteamHourBoost - Help')
        .setURL('https://github.com/dimaslesmana/steamhourboost-discord#available-slash-commands')
        .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() })
        .setDescription('Below is the list of available slash commands.')
        .addFields(
          { name: 'Boost commands', value: '`/boost`', inline: true },
          { name: 'User commands', value: '`/user`', inline: true },
          { name: 'Config commands', value: '`/config`', inline: true },
          { name: 'Help command', value: '`/help`', inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [helpEmbed] });
    } catch (error) {
      logger.error(error);
      await interaction.editReply('Failed to show help.');
    }
  },
};
