const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const { logger } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    try {
      const botUptime = ms(interaction.client.uptime);
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

      await interaction.reply({ embeds: [pingEmbed], ephemeral: true });
    } catch (error) {
      logger.error(error);
      await interaction.reply('Failed to get bot latency.');
    }
  },
};
