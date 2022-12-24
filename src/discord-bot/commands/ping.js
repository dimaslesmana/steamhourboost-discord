const ms = require('ms');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logger } = require('../../helpers/logger.helper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const botUptime = ms(interaction.client.uptime, { long: true });
      const botLatency = Date.now() - interaction.createdTimestamp;
      const apiLatency = Math.round(interaction.client.ws.ping);

      const pingEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('SteamHourBoost - GitHub')
        .setURL('https://github.com/dimaslesmana/steamhourboost-discord')
        .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() })
        .setDescription('This bot is still in development. Please report if you find any issues.')
        .addFields(
          { name: 'Bot Uptime', value: `\`${botUptime}\``, inline: true },
          { name: 'Bot Latency', value: `\`${botLatency} ms\``, inline: true },
          { name: 'API Latency', value: `\`${apiLatency} ms\``, inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [pingEmbed], ephemeral: true });
    } catch (error) {
      logger.error(error);
      await interaction.editReply('Failed to get bot latency.');
    }
  },
};
