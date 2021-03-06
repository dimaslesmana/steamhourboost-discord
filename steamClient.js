const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');

const { decrypt } = require('./helpers/crypto');
const log = require('./helpers/logger');
const shuffleArray = require('./helpers/shuffle-array');
const { setLoginKey } = require('./helpers/steam-login-key');
const { knex, db } = require('./helpers/database');

const steamBots = {};
const steamAccounts = [];

steamBots.new = (account) => {
  const client = new SteamUser({
    dataDirectory: "./accountsData",
    singleSentryfile: false
  });

  client.id = account.id;
  client.ownerId = account.owner_id;
  client.isRunning = account.is_running;
  client.username = account.username;
  client.password = account.password;
  client.loginKey = account.loginkey;
  client.sharedSecret = account.sharedsecret;
  client.onlineStatus = account.onlinestatus;
  client.games = account.games;
  client.steamGuardAuth = null;

  const replyDiscord = async msg => {
    const steamAccount = steamAccounts.find(acc => acc.steamClient.id === client.id);
    if (steamAccount == null) {
      return;
    }

    if (steamAccount.discordClient == null) {
      console.log(`${log('steam')} ${msg}`);
      return;
    }

    try {
      // Get owner's discord id
      const user = await knex(db.table.discord).where({ id: client.ownerId });

      // no account found
      if (!user.length) return;

      steamAccount.discordClient.users.cache.get(user[0].discord_id).send(msg);
    } catch (err) {
      console.log(`${log('discord')} ${client.username} | ERROR: OnDiscordReplyMessage: ${err}`);
    }
  };

  const updateSteamGuardAuth = (value = null) => {
    const steamAccount = steamAccounts.find(acc => acc.steamClient.id === client.id);

    if (steamAccount == null) return;

    // Set steamGuardAuth to null
    if (value == null) {
      steamAccount.steamClient.steamGuardAuth = null;
      return;
    }

    steamAccount.steamClient.steamGuardAuth = {
      message: value.message,
      callback: value.callback
    };
  };

  client.doLogin = function () {
    try {
      if (this.loginKey && !this.sharedSecret) {
        // replyDiscord(`${log('steam')} ${this.username} | Trying to login using login key - Please wait...`);
        this.logOn({
          accountName: this.username,
          loginKey: this.loginKey,
          machineName: "Steam-Hourboost",
          rememberPassword: true
        });
      } else {
        // replyDiscord(`${log('steam')} ${this.username} | Trying to login using password - Please wait...`);

        // Decrypt steam password
        const password = decrypt(this.password);

        this.logOn({
          accountName: this.username,
          password: password,
          machineName: "Steam-Hourboost",
          rememberPassword: true
        });
      }
    } catch (err) {
      console.log(`${log('steam')} ${this.username} | ERROR: OnLogOn: ${err}`);
      replyDiscord(`${log('steam')} ${this.username} | ERROR: OnLogOn! - Retrying in 40 minutes...`);
      setTimeout(() => {
        client.doLogin();
      }, 40 * 60 * 1000);
    }
  }

  client.doLogOff = async function (index) {
    try {
      replyDiscord(`${log('steam')} ${this.username} | Trying to log out - Please wait...`);
      // Update is_runnning status in database
      await knex(db.table.steam).where({ id: this.id, owner_id: this.ownerId }).update({ is_running: false });
      this.logOff();
      replyDiscord(`${log('steam')} ${this.username} | INFO: Account stopped & logged out!`);

      // Remove Steam account from array
      steamAccounts.splice(index, 1);
    } catch (err) {
      console.log(`${log('steam')} ${this.username} | ERROR: ${err}`);
      return;
    }
  }

  client.on('loggedOn', async function (details) {
    switch (details.eresult) {
      case SteamUser.EResult.OK:
        try {
          // Update is_runnning status in database
          await knex(db.table.steam).where({ id: this.id, owner_id: this.ownerId }).update({ is_running: true });
          // Reset steam guard callback to null
          updateSteamGuardAuth();

          // Steam online status
          client.setPersona(this.onlineStatus ? SteamUser.EPersonaState.Online : SteamUser.EPersonaState.Invisible);
          replyDiscord(`${log('steam')} ${this.username} | Successfully logged on as ${client.steamID.getSteamID64()}`);

          // Start games
          client.gamesPlayed(shuffleArray(this.games));

          replyDiscord(`${log('steam')} ${this.username} | Started playing ${JSON.stringify(this.games)}`);
        } catch (err) {
          console.log(`${log('steam')} ${this.username} | ERROR: ${err}`);
          return;
        }
        break;
      default:
        replyDiscord(`${log('steam')} ${this.username} | eresult: ${details.eresult}`);
        break;
    }
  });

  client.on('steamGuard', function (domain, callback) {
    if (this.sharedSecret) {
      const authCode = SteamTotp.generateAuthCode(this.sharedSecret);
      replyDiscord(`${log('steam')} ${this.username} | Generated Auth Code: ${authCode}`);
      callback(authCode);
    } else {
      // Reset steam guard callback to null
      updateSteamGuardAuth();

      const steamGuardType = domain ? `Email (${domain})` : `App`;
      const message = `Steam Guard ${steamGuardType} Code`;
      // Set steam guard callback
      updateSteamGuardAuth({ message, callback });

      replyDiscord(`${log('steam')} ${this.username} | ${message} required!\nEnter 2FA code using **!2fa \`username\` \`code\`**`);
    }
  });

  client.on('loginKey', async function (key) {
    this.loginKey = await setLoginKey(this.username, this.id, key);
  });

  client.on('playingState', function (blocked, playingApp) {
    if (blocked) {
      replyDiscord(`${log('steam')} ${this.username} | INFO: Game is being played in another location: [${playingApp}]`);
    }
  });

  client.on('vacBans', function (numBans, appids) {
    if (numBans > 0) {
      const appList = `In apps: [${appids.join(`, `)}]`;
      replyDiscord(`${log('steam')} ${this.username} | ${numBans} VAC ${numBans > 1 ? 'bans' : 'ban'} - ${appids.length > 0 ? appList : ''}`);
    }
  });

  client.on('error', async function (error) {
    try {
      // Update is_runnning status in database
      await knex(db.table.steam).where({ id: this.id, owner_id: this.ownerId }).update({ is_running: false });
    } catch (err) {
      console.log(`${log('steam')} ${this.username} | ERROR: ${err}`);
      return;
    }

    // Reset steam guard callback to null
    updateSteamGuardAuth();

    switch (error.eresult) {
      case SteamUser.EResult.InvalidPassword:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Invalid ${this.loginKey ? "login key" : "password"}`);

        if (this.loginKey) {
          this.loginKey = await setLoginKey(this.username, this.id, "");

          replyDiscord(`${log('steam')} ${this.username} | INFO: Logged out - Reconnecting in 5 seconds...`);
          setTimeout(() => {
            replyDiscord(`${log('steam')} ${client.username} | INFO: Reconnecting...`);
            client.doLogin();
          }, 5 * 1000);
        } else {
          this.logOff();
          replyDiscord(`${log('steam')} ${this.username} | WARNING: Please check your password as soon as possible!`);
        }

        return;
      case SteamUser.EResult.LoggedInElsewhere:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Logged in elsewhere!`);
        break;
      case SteamUser.EResult.AccountLogonDenied:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Steam Guard required!`);
        break;
      case SteamUser.EResult.AccountDeleted:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Steam account has been deleted!`);
        this.logOff();
        return;
      default:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: ${error}`);
        break;
    }

    replyDiscord(`${log('steam')} ${this.username} | INFO: Logged out - Reconnecting in 40 minutes...`);

    setTimeout(() => {
      replyDiscord(`${log('steam')} ${client.username} | INFO: Reconnecting...`);
      client.doLogin();
    }, 40 * 60 * 1000);
  });

  return client;
};

module.exports = { steamBots, steamAccounts };
