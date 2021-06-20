const discordBot = require('./discordClient');

(async () => {
  const discordClient = discordBot.new();
  discordClient.doLogin();
})();
