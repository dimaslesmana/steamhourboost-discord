const currentTime = require('./current-time');

module.exports = (type) => {
  switch (type) {
    case 'discord':
      return `[${currentTime()} - DISCORD]`;
    case 'steam':
      return `[${currentTime()} - STEAM]`;
  }
};