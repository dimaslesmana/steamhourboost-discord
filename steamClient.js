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

  const replyDiscord = (msg) => {
    const steamAccount = steamAccounts.find(acc => acc.steamClient.id === client.id);
    if (steamAccount == null) {
      return;
    }

    if (steamAccount.discordClient == null) {
      console.log(`${log('steam')} ${msg}`);
      return;
    }

    steamAccount.discordClient.message.reply(`\n${msg}`);
  };

  const updateSteamGuardAuth = (value = null) => {
    const steamAccount = steamAccounts.find(acc => acc.steamClient.id === client.id);

    if (steamAccount == null) {
      return;
    }

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
        this.logOn({
          accountName: this.username,
          loginKey: this.loginKey,
          machineName: "Steam-Hourboost",
          rememberPassword: true
        });
      } else {
        // Decrypt steam password
        const decrpytedPassword = decrypt({ iv: this.password[0], content: this.password[1] });

        this.logOn({
          accountName: this.username,
          password: decrpytedPassword,
          machineName: "Steam-Hourboost",
          rememberPassword: true
        });
      }
    } catch (err) {
      console.log(`${log('steam')} ${this.username} | ERROR: OnLogOn: ${err}`);
      setTimeout(() => {
        client.doLogin();
      }, 40 * 60 * 1000);
    }
  }

  client.doLogOff = async function () {
    this.logOff();

    try {
      // Update is_runnning status in database
      await knex(db.table.steam).where({ id: this.id, owner_id: this.ownerId }).update({ is_running: false });
    } catch (err) {
      console.log(`${log('steam')} ${this.username} | ERROR: ${err}`);
      return;
    }

    replyDiscord(`${log('steam')} ${this.username} | INFO: Account logged out!`);
  }

  client.on('loggedOn', async function (details) {
    switch (details.eresult) {
      case SteamUser.EResult.OK:
        try {
          // Update is_runnning status in database
          await knex(db.table.steam).where({ id: this.id, owner_id: this.ownerId }).update({ is_running: true });
        } catch (err) {
          console.log(`${log('steam')} ${this.username} | ERROR: ${err}`);
          return;
        }
        updateSteamGuardAuth();

        replyDiscord(`${log('steam')} ${this.username} | Successfully logged on as ${client.steamID.getSteamID64()}`);
        // Steam online status
        client.setPersona(this.onlineStatus ? SteamUser.EPersonaState.Online : SteamUser.EPersonaState.Invisible);

        // Start games
        client.gamesPlayed(shuffleArray(this.games));

        replyDiscord(`${log('steam')} ${this.username} | Started playing ${JSON.stringify(this.games)}`);
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
      updateSteamGuardAuth();

      const steamGuardType = domain ? `Email (${domain})` : `App`;
      const message = `Steam Guard ${steamGuardType} Code`;
      replyDiscord(`${log('steam')} ${this.username} | ${message} required!\nEnter 2FA code using **!2fa \`username\` \`code\`**`);

      updateSteamGuardAuth({ message, callback });
    }
  });

  client.on('loginKey', function (key) {
    this.loginKey = setLoginKey(this.username, this.id, key);
  });

  client.on('playingState', function (blocked, playingApp) {
    if (blocked) {
      replyDiscord(`${log('steam')} ${this.username} | INFO: Game is being played in another location: [${playingApp}]`);
    }
  });

  client.on('vacBans', function (numBans, appids) {
    if (numBans > 0) {
      const appList = `In apps: [${appids.join(`, `)}]`;
      replyDiscord(`${log('steam')} ${this.username} | ${numBans} VAC ban${numBans > 1 ? 's' : ''} - ${appids.length > 0 ? appList : ''}`);
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
    updateSteamGuardAuth();

    switch (details.eresult) {
      case SteamUser.EResult.InvalidPassword:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Invalid ${this.loginKey ? "login key" : "password"}`);

        if (this.loginKey) {
          this.loginKey = setLoginKey(this.username, this.id, "");

          replyDiscord(`${log('steam')} ${this.username} | INFO: Logged out - Reconnecting in 5 seconds...`);
          setTimeout(() => {
            replyDiscord(`${log('steam')} ${client.username} | INFO: Reconnecting...`);
            client.doLogin();
          }, 5 * 1000);
        } else {
          client.logOff();
          replyDiscord(`${log('steam')} ${this.username} | WARNING: Please check your password as soon as possible!`);
        }

        return;
      case SteamUser.EResult.LoggedInElsewhere:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Logged in elsewhere`);
        break;
      case SteamUser.EResult.AccountLogonDenied:
        replyDiscord(`${log('steam')} ${this.username} | ERROR: Steam Guard required`);
        break;
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
