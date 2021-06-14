const env = require('./load-env');

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: env.DB_HOST(),
    user: env.DB_USER(),
    password: env.DB_PASS(),
    database: env.DB_NAME()
  }
});

const db = {
  table: {
    discord: 'discord_accounts',
    steam: 'steam_accounts',
    license_code: 'license_code',
    license_type: 'license_type'
  }
};

module.exports = { knex, db };
