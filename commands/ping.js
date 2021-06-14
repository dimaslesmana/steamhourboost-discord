// const { steamAccounts } = require('../steamClient');

module.exports = {
  name: 'ping',
  description: 'Ping!',
  execute(client, prefix, commands, message, args, user = []) {
    message.channel.send(`Pinging...`).then(msg => {
      const ping = Date.now() - msg.createdTimestamp;
      msg.edit(`Bot Ping: ${ping}`);
    });

    // console.log(steamAccounts);
  }
};