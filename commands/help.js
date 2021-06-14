module.exports = {
  name: 'help',
  description: 'Help command!',
  execute(prefix, commands, message, args, user = []) {
    // return if user is not found
    if (!user.length) {
      message.reply(
        "\n**Steam-HourBoost**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.help}:** Show this messages.` +
        "\n" + `**${prefix}${commands.license}:** See more about this command.` +
        "\n" + "---------------------------------"
      );
    } else {
      message.reply(
        "\n**Steam-HourBoost**" +
        "\n" + "*Created by kezoura*" +
        "\n" + "---------------------------------" +
        "\n" + `**${prefix}${commands.help}:** Show this messages.` +
        "\n" + `**${prefix}${commands.list}:** List of your accounts.` +
        "\n" + `**${prefix}${commands.license}:** See more about this command.` +
        "\n" + `**${prefix}${commands.account}:** See more about this command.` +
        "\n" + `**${prefix}${commands.manage}:** See more about this command.` +
        "\n" + `**${prefix}${commands.start} \`username\`:** Start specified Steam account.` +
        "\n" + `**${prefix}${commands.stop} \`username\`:** Stop specified Steam account.` +
        "\n" + "---------------------------------"
      );
    }
  }
};