require('dotenv').config();
const env = process.env;

module.exports = {
  DB_HOST: () => env.DB_HOST,
  DB_USER: () => env.DB_USER,
  DB_PASS: () => env.DB_PASS,
  DB_NAME: () => env.DB_NAME,
  CRYPTO_SECRET: () => env.CRYPTO_SECRET,
  DISCORD_BOT_PREFIX: () => env.DISCORD_BOT_PREFIX,
  DISCORD_BOT_TOKEN: () => env.DISCORD_BOT_TOKEN,
  DISCORD_ADMIN_ID: () => env.DISCORD_ADMIN_ID,
};

