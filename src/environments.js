'use strict';

require('dotenv').config();
const assert = require('assert');

const { CRYPTO_SECRET_KEY, DISCORD_CLIENT_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_ADMIN_ID } = process.env;

assert(CRYPTO_SECRET_KEY, 'CRYPTO_SECRET_KEY is required');
assert(DISCORD_CLIENT_ID, 'DISCORD_CLIENT_ID is required');
assert(DISCORD_BOT_TOKEN, 'DISCORD_BOT_TOKEN is required');
assert(DISCORD_GUILD_ID, 'DISCORD_GUILD_ID is required');
assert(DISCORD_ADMIN_ID, 'DISCORD_ADMIN_ID is required');

module.exports = {
  CRYPTO_SECRET_KEY,
  DISCORD_CLIENT_ID,
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_ADMIN_ID,
};
