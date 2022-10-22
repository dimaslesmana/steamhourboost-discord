const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    const botLatency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const pingEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('SteamHourBoost - GitHub')
      .setURL('https://github.com/dimaslesmana/steamhourboost-discord')
      .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() })
      .setDescription('This bot is still in development. Please report if you find any issues.')
      .addFields(
        { name: 'Bot Latency', value: `\`${botLatency}\``, inline: true },
        { name: 'API Latency', value: `\`${apiLatency}\``, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [pingEmbed], ephemeral: true });
  },
};
