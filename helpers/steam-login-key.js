const { knex, db } = require('./database');
const currentTime = require('./current-time');

const setLoginKey = async (username, id, loginkey) => {
  try {
    // Update login key to database
    await knex(db.table.steam).where({ id, username }).update({ loginkey });

    return loginkey;
  } catch (err) {
    console.log(`[${currentTime()} - ${username}] ERROR | ${err}`);
    return "";
  }
};

const getLoginKey = async (username, id, loginkey) => {
  try {
    const account = await knex(db.table.steam).where({ id, username });

    return account[0].loginkey;
  } catch (err) {
    console.log(`[${currentTime()} - ${username}] ERROR | ${err}`);
  }
};

module.exports = { setLoginKey, getLoginKey };