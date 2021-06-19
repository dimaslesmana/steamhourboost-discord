module.exports = {
  name: 'ping',
  description: 'Ping!',
  execute(client, prefix, commands, message, args, user = []) {
    message.author.send(`Pinging...`).then(msg => {
      const ping = Date.now() - msg.createdTimestamp;
      msg.edit(`Bot Ping: ${ping}`);
    });
  }
};