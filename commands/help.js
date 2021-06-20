module.exports = {
  name: 'help',
  description: 'Help command!',
  execute(client, prefix, commands, message, args, user = []) {
    if (!user.length) {
      client.users.cache.get(message.author.id).send(
        "\n**Steam-HourBoost**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.help}:** Show this messages.` +
        "\n" + `**${prefix}${commands.license}:** See more about this command.` +
        "\n" + "---------------------------------"
      );
    } else {
      client.users.cache.get(user[0].discord_id).send(
        "\n**Steam-HourBoost**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.help}:** Show this messages.` +
        "\n" + `**${prefix}${commands.list}:** List of your accounts.` +
        "\n" + `**${prefix}${commands.license}:** See more about this command.` +
        "\n" + `**${prefix}${commands.account}:** See more about this command.` +
        "\n" + `**${prefix}${commands.manage}:** See more about this command.` +
        "\n" + `**${prefix}${commands.start} \`username\`:** Start Steam account.` +
        "\n" + `**${prefix}${commands.stop} \`username\`:** Stop Steam account.` +
        "\n" + `**${prefix}${commands.restart} \`username\`:** Restart running Steam account. \*(Omit username to restart all account)\*` +
        "\n" + "---------------------------------"
      );
    }
  }
};