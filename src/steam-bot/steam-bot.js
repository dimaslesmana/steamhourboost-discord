const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamAccount = require('../services/steam-account.service');
const { encrypt, decrypt } = require('../utils/crypto.util');
const shuffleArray = require('../utils/shuffle-array.util');
const { BotStatus } = require('../types');
const { logger } = require('../helpers/logger.helper');
const timestamp = require('../utils/timestamp.util');

class SteamBot {
  #error;
  #status;
  #isRunning;
  #steamGuardAuth;
  #discordOwnerId;
  #username;
  #password;
  #loginKey;
  #sharedSecret;
  #onlineStatus;
  #games;
  #vacStatus;
  #toBeRemoved;

  #discordClient;

  constructor(account, discordClient) {
    this.#error = null;
    this.#status = BotStatus.Idle;
    this.#isRunning = false;
    this.#steamGuardAuth = null;
    this.#discordOwnerId = account.discordOwnerId;
    this.#username = account.username;
    this.#password = account.password;
    this.#loginKey = account.loginKey;
    this.#sharedSecret = account.sharedSecret;
    this.#onlineStatus = account.onlineStatus;
    this.#games = account.games;
    this.#vacStatus = null;
    this.#toBeRemoved = false;

    this.#discordClient = discordClient;

    this.steamUser = new SteamUser({
      dataDirectory: './accounts-data',
      singleSentryfile: false,
    });

    this.steamUser.on('loggedOn', this.onLoggedOn.bind(this));
    this.steamUser.on('steamGuard', this.onSteamGuardAuth.bind(this));
    this.steamUser.on('loginKey', this.onLoginKey.bind(this));
    this.steamUser.on('playingState', this.onPlayingState.bind(this));
    this.steamUser.on('vacBans', this.onVacBans.bind(this));
    this.steamUser.on('error', this.onError.bind(this));
    this.steamUser.on('disconnected', this.onDisconnected.bind(this));
  }

  replyDiscord(message) {
    const { sendDM } = this.#discordClient.functions;

    const msg = `[${timestamp()}] **${this.getUsername()}** | ${message}`;

    sendDM(this.getDiscordOwnerId(), msg);
  }

  setError(error) {
    this.#error = error;
  }

  getError() {
    return this.#error;
  }

  setStatus(status) {
    this.#status = status;
  }

  getStatus() {
    return this.#status;
  }

  async setIsRunning(isRunning) {
    try {
      this.#isRunning = isRunning;

      // * Update running status in database
      await SteamAccount.setRunningStatus(this.getUsername(), this.#isRunning);
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      throw new Error('Failed to set running status on bot!');
    }
  }

  isRunning() {
    return this.#isRunning;
  }

  setSteamGuardAuth(steamGuardAuth = null) {
    this.#steamGuardAuth = steamGuardAuth;
  }

  getSteamGuardAuth() {
    return this.#steamGuardAuth;
  }

  setDiscordOwnerId(discordOwnerId) {
    this.#discordOwnerId = discordOwnerId;
  }

  getDiscordOwnerId() {
    return this.#discordOwnerId;
  }

  setUsername(username) {
    this.#username = username;
  }

  getUsername() {
    return this.#username;
  }

  async setLoginKey(loginKey, doEncrypt = true) {
    try {
      this.#loginKey = (doEncrypt ? encrypt(loginKey) : loginKey);

      // * Set login key to database
      await SteamAccount.setLoginKey(this.getUsername(), this.#loginKey);
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      throw new Error('Failed to set login key on bot!');
    }
  }

  getLoginKey() {
    return decrypt(this.#loginKey);
  }

  setSharedSecret(sharedSecret, doEncrypt = true) {
    this.#sharedSecret = (doEncrypt ? encrypt(sharedSecret) : sharedSecret);
  }

  getSharedSecret() {
    return decrypt(this.#sharedSecret);
  }

  setOnlineStatus(onlineStatus) {
    this.#onlineStatus = onlineStatus;
  }

  getOnlineStatus() {
    return this.#onlineStatus;
  }

  setGames(games) {
    this.#games = games;
  }

  getGames() {
    return this.#games;
  }

  setVacStatus(vacStatus) {
    this.#vacStatus = vacStatus;
  }

  getVacStatus() {
    return this.#vacStatus;
  }

  inputSteamGuardCode(code) {
    const { callback } = this.getSteamGuardAuth();
    callback(code);
  }

  getSteamId64() {
    return this.steamUser.steamID.getSteamID64();
  }

  doLogin() {
    try {
      this.setStatus(BotStatus.LoggingIn);

      if (this.getLoginKey() && !this.getSharedSecret()) {
        // * Login using login key
        this.replyDiscord('Logging in using login key...');

        this.steamUser.logOn({
          accountName: this.getUsername(),
          loginKey: this.getLoginKey(),
          machineName: `SHBD-${this.getDiscordOwnerId()}`,
          rememberPassword: true,
        });
      } else {
        // * Login using password
        this.replyDiscord('Logging in using password...');

        this.steamUser.logOn({
          accountName: this.getUsername(),
          password: decrypt(this.#password),
          machineName: `SHBD-${this.getDiscordOwnerId()}`,
          rememberPassword: true,
        });
      }
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(BotStatus.LoginError);

      this.replyDiscord('Error while logging in!');
    }
  }

  doLogOff(removeAccount = false) {
    try {
      this.setStatus(BotStatus.LoggingOut);
      this.replyDiscord('Logging out...');

      this.#toBeRemoved = removeAccount;
      this.steamUser.logOff();

      this.setStatus(BotStatus.LoggedOut);
      this.replyDiscord('Successfully logged out!');
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(BotStatus.LogoutError);

      this.replyDiscord('Error while logging out!');
    }
  }

  restart() {
    try {
      this.setStatus(BotStatus.Relogin);
      this.replyDiscord('Relogging in...');

      this.steamUser.relog();
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(BotStatus.ReloginError);

      this.replyDiscord('Error while restarting!');
    }
  }

  async onLoggedOn(details) {
    try {
      switch (details.eresult) {
        case SteamUser.EResult.OK:
          this.setStatus(BotStatus.LoggedIn);
          await this.setIsRunning(true);

          // Reset steam guard auth to null
          this.setSteamGuardAuth(null);

          // Set steam online status
          this.steamUser.setPersona(this.getOnlineStatus() ? SteamUser.EPersonaState.Online : SteamUser.EPersonaState.Invisible);
          this.replyDiscord(`Successfully logged on as \`${this.steamUser.steamID.getSteamID64()}\`!`);

          // Start playing games
          this.steamUser.gamesPlayed(shuffleArray(this.getGames()));
          this.replyDiscord(`Started playing \`${JSON.stringify(this.getGames())}\`!`);

          this.setStatus(BotStatus.BoostStarted);
          break;
        default:
          this.setStatus(BotStatus.UnhandledLoggedInEvent(details.eresult));
          logger.warn(`${this.getUsername()} | Unhandled eresult loggedOn event: ${details.eresult}`);

          this.replyDiscord(`Unhandled logged on event: ${details.eresult}`);
          break;
      }
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(BotStatus.Error(error));

      this.replyDiscord('Error after logging in!');
    }
  }

  onSteamGuardAuth(domain, callback) {
    this.setStatus(BotStatus.SteamGuardRequired);

    if (this.getSharedSecret()) {
      const authCode = SteamTotp.generateAuthCode(this.getSharedSecret());
      callback(authCode);

      this.replyDiscord(`Using generated auth code to login \`${authCode}\``);
    } else {
      // Reset steam guard auth to null
      this.setSteamGuardAuth(null);

      const steamGuardType = domain ? `Email (${domain})` : 'Mobile App';
      const message = `Steam Guard ${steamGuardType} Code`;

      // Set steam guard callback
      this.setSteamGuardAuth({ message, callback });

      this.replyDiscord(`${message} required! Please enter the code using \`/boost steam-guard\` command.`);
    }
  }

  async onLoginKey(loginKey) {
    await this.setLoginKey(loginKey);
  }

  onPlayingState(blocked, playingApp) {
    if (blocked) {
      this.replyDiscord(`Game is being played in another session (AppID is ${playingApp})`);

      this.setStatus(BotStatus.BlockedFromPlayingGames(playingApp));
    }
  }

  onVacBans(numBans, appids) {
    if (numBans > 0) {
      this.setVacStatus({ numBans, appids });
    }
  }

  async onError(error) {
    try {
      this.setError(BotStatus.Error(error));
      await this.setIsRunning(false);

      // Reset steam guard auth to null
      this.setSteamGuardAuth(null);

      switch (error.eresult) {
        case SteamUser.EResult.InvalidPassword:
          this.replyDiscord(`ERROR: Invalid ${this.getLoginKey() ? 'login key' : 'password'}!`);

          if (this.getLoginKey()) {
            this.setError(BotStatus.InvalidLoginKey);

            // Reset login key
            await this.setLoginKey('');

            // Retry login after 5 seconds
            this.replyDiscord('Reconnecting in 5 seconds...');
            setTimeout(() => {
              this.replyDiscord('Reconnecting...');

              this.doLogin();
            }, 5 * 1000);
          } else {
            this.setError(BotStatus.InvalidPassword);
            this.doLogOff();

            this.replyDiscord('Boost stopped! WARNING: Please check your password as soon as possible!');
          }
          return;
        case SteamUser.EResult.LoggedInElsewhere:
          this.setError(BotStatus.ErrorLoggedInElsewhere);

          this.replyDiscord('ERROR: Logged in elsewhere!');
          break;
        case SteamUser.EResult.AccountLogonDenied:
          this.setError(BotStatus.SteamGuardRequired);

          this.replyDiscord('ERROR: Steam Guard required!');
          break;
        case SteamUser.EResult.AccountHasBeenDeleted:
          this.setError(BotStatus.ErrorAccountDeleted);

          this.replyDiscord('ERROR: Account has been deleted!');

          this.doLogOff();
          return;
        default:
          this.setError(BotStatus.Error(error));
          logger.warn(`${this.getUsername()} | ERROR: Unhandled eresult error event: ${error.eresult}`);

          this.replyDiscord(`ERROR: Unhandled error event: ${error.eresult}`);
          break;
      }

      this.replyDiscord('Reconnecting in 40 minutes...');

      // Retry login after 40 minutes
      setTimeout(() => {
        this.replyDiscord('Reconnecting...');

        this.doLogin();
      }, 40 * 60 * 1000);
    } catch (err) {
      logger.error(`${this.getUsername()} | ${err}`);
      this.setError(BotStatus.Error(err));

      this.replyDiscord('Error!');
    }
  }

  async onDisconnected() {
    if (!this.#toBeRemoved) {
      await this.setIsRunning(false);
      // Reset steam guard auth to null
      this.setSteamGuardAuth(null);
      this.setStatus(BotStatus.Disconnected);
    }
  }
}

module.exports = SteamBot;
