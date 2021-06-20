module.exports = {
  name: 'ping',
  description: 'Ping!',
  execute(client, prefix, commands, message, args, user = []) {
    client.users.cache.get(message.author.id).send(`Pinging...`).then(msg => {
      const ping = Date.now() - msg.createdTimestamp;
      msg.edit(`Bot Ping: ${ping}`);
    });
  }
};