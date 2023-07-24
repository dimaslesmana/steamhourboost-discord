const ms = require('ms');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const { LoginSession, EAuthSessionGuardType, EAuthTokenPlatformType, EResult } = require('steam-session');
const SteamAccount = require('../services/steam-account.service');
const { encrypt, decrypt } = require('../utils/crypto.util');
const { shuffleArray } = require('../utils/array.util');
const { isTokenExpired } = require('../utils/jwt.util');
const { STEAM_BOT_STATUS } = require('../constants');
const { logger } = require('../helpers/logger.helper');
const timestamp = require('../utils/timestamp.util');

class SteamBot {
  #error;
  #status;
  #loginTimeout;
  #isRunning;
  #steamGuardAuth;
  #discordOwnerId;
  #username;
  #password;
  #sharedSecret;
  #refreshToken;
  #onlineStatus;
  #games;
  #vacStatus;
  #toBeRemoved;
  #toBeRestarted;

  #discordClient;

  constructor(account, discordClient) {
    this.#error = null;
    this.#status = STEAM_BOT_STATUS.IDLE;
    this.#loginTimeout = 3 * 60 * 1000;
    this.#isRunning = false;
    this.#steamGuardAuth = null;
    this.#discordOwnerId = account.discordOwnerId;
    this.#username = account.username;
    this.#password = account.password;
    this.#sharedSecret = account.sharedSecret;
    this.#refreshToken = account.refreshToken;
    this.#onlineStatus = account.onlineStatus;
    this.#games = account.games;
    this.#vacStatus = null;
    this.#toBeRemoved = false;
    this.#toBeRestarted = false;

    this.#discordClient = discordClient;

    this.steamUser = new SteamUser({
      dataDirectory: './accounts-data',
      singleSentryfile: false,
    });

    this.steamUser.on('loggedOn', this.onLoggedOn.bind(this));
    this.steamUser.on('steamGuard', this.onSteamGuardAuth.bind(this));
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

  setSharedSecret(sharedSecret, doEncrypt = true) {
    this.#sharedSecret = (doEncrypt ? encrypt(sharedSecret) : sharedSecret);
  }

  getSharedSecret() {
    return decrypt(this.#sharedSecret);
  }

  async setRefreshToken(refreshToken, doEncrypt = true) {
    try {
      this.#refreshToken = (doEncrypt ? encrypt(refreshToken) : refreshToken);

      // * Set refresh token to database
      await SteamAccount.setRefreshToken(this.getUsername(), this.#refreshToken);
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      throw new Error('Failed to set refresh token on bot!');
    }
  }

  getRefreshToken() {
    return decrypt(this.#refreshToken);
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

  async inputSteamGuardCode(code) {
    if (!this.getSteamGuardAuth()) {
      return;
    }

    const { callback } = this.getSteamGuardAuth();

    try {
      await callback(code);
    } catch (error) {
      switch (error.eresult) {
        case EResult.InvalidLoginAuthCode:
          this.replyDiscord('Invalid Steam Guard Email code!');
          return;
        case EResult.TwoFactorCodeMismatch:
          this.replyDiscord('Invalid Steam Guard Mobile Authenticator code!');

          if (this.getSharedSecret()) {
            this.replyDiscord('Either your Steam Guard Mobile code is wrong or your shared secret is invalid!');
          }
          return;
        default:
          logger.error(`${this.getUsername()} | Unhandled error while authenticating Steam Guard: ${error?.message} (${error?.eresult}) - ${error}`);
          this.replyDiscord(`ERROR: Unhandled error while authenticating Steam Guard: ${error?.message} (${error?.eresult})!`);
          break;
      }

      throw error;
    }
  }

  getSteamId64() {
    return this.steamUser.steamID.getSteamID64();
  }

  #login() {
    try {
      this.replyDiscord('Logging in using refresh token...');

      this.steamUser.logOn({
        refreshToken: this.getRefreshToken(),
        machineName: `SHBD-${this.getDiscordOwnerId()}`,
        clientOS: SteamUser.EOSType.Windows10,
      });
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(STEAM_BOT_STATUS.LOGIN_ERROR);

      this.replyDiscord('Error while logging in!');
    }
  }

  async initSteamSession() {
    try {
      // Skip initializing new session if refresh token is not expired
      if (this.getRefreshToken() && !isTokenExpired(this.getRefreshToken())) {
        this.#login();
        return;
      }

      this.replyDiscord('Getting new refresh token...');

      const steamSession = new LoginSession(EAuthTokenPlatformType.SteamClient);
      steamSession.loginTimeout = this.#loginTimeout;

      const { actionRequired, validActions } = await steamSession.startWithCredentials({
        accountName: this.getUsername(),
        password: decrypt(this.#password),
      });

      if (actionRequired) {
        const promptingGuardTypes = [EAuthSessionGuardType.EmailCode, EAuthSessionGuardType.DeviceCode];
        const promptingGuards = validActions.filter((action) => promptingGuardTypes.includes(action.type));

        for (const action of promptingGuards) {
          switch (action.type) {
            case EAuthSessionGuardType.EmailCode:
              this.setSteamGuardAuth({ isSessionSteamGuard: true, callback: (code) => steamSession.submitSteamGuardCode(code) });

              this.replyDiscord(`Steam Guard Email (${action?.detail}) Code required! Please enter the code using \`/boost steam-guard\` command.`);
              break;
            case EAuthSessionGuardType.DeviceCode:
              this.setSteamGuardAuth({ isSessionSteamGuard: true, callback: (code) => steamSession.submitSteamGuardCode(code) });

              if (this.getSharedSecret()) {
                const authCode = SteamTotp.getAuthCode(this.getSharedSecret());

                this.replyDiscord(`Trying using generated Steam Guard Code to login: \`${authCode}\``);
                this.inputSteamGuardCode(authCode);
              } else {
                this.replyDiscord('Steam Guard Mobile App Code required! Please enter the code using `/boost steam-guard` command.');
              }
              break;
          }
        }
      }

      steamSession.on('authenticated', async () => {
        await this.setRefreshToken(steamSession.refreshToken);

        this.#login();
      });

      steamSession.on('timeout', () => {
        this.setSteamGuardAuth(null);

        this.replyDiscord(`Login attempt timed out! Please try again. (Max timeout: \`${ms(this.#loginTimeout, { long: true })}\`)`);
      });

      steamSession.on('error', (error) => {
        this.setSteamGuardAuth(null);

        logger.error(`${this.getUsername()} | ERROR: Login attempt failed! ${error}`);
        this.replyDiscord(`ERROR: Login attempt failed! ${error?.message ?? error}`);
      });
    } catch (error) {
      switch (error.eresult) {
        case EResult.InvalidPassword:
          this.replyDiscord('ERROR: Invalid password while logging in!');
          return;
        default:
          logger.error(`${this.getUsername()} | Unhandled error on login: ${error?.message} (${error?.eresult}) - ${error}`);
          this.replyDiscord(`ERROR: Unhandled error on login: ${error?.message} (${error?.eresult})!`);
          break;
      }

      throw error;
    }
  }

  start() {
    try {
      this.setStatus(STEAM_BOT_STATUS.LOGGING_IN);

      this.initSteamSession();
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(STEAM_BOT_STATUS.LOGIN_ERROR);

      this.replyDiscord('Error while starting bot!');
    }
  }

  stop(removeAccount = false) {
    try {
      this.setStatus(STEAM_BOT_STATUS.LOGGING_OUT);
      this.replyDiscord('Logging out...');

      this.#toBeRemoved = removeAccount;
      this.steamUser.logOff();

      this.setStatus(STEAM_BOT_STATUS.LOGGED_OUT);
      this.replyDiscord('Successfully logged out!');
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(STEAM_BOT_STATUS.LOGOUT_ERROR);

      this.replyDiscord('Error while logging out!');
    }
  }

  restart() {
    try {
      this.setStatus(STEAM_BOT_STATUS.RESTART);

      this.#toBeRestarted = true;
      this.steamUser.logOff();
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(STEAM_BOT_STATUS.RESTART_ERROR);

      this.replyDiscord('Error while restarting!');
    }
  }

  async onLoggedOn(details) {
    try {
      switch (details.eresult) {
        case SteamUser.EResult.OK:
          this.setStatus(STEAM_BOT_STATUS.LOGGED_IN);
          await this.setIsRunning(true);

          // Reset steam guard auth to null
          this.setSteamGuardAuth(null);

          // Set steam online status
          this.steamUser.setPersona(this.getOnlineStatus() ? SteamUser.EPersonaState.Online : SteamUser.EPersonaState.Invisible);
          this.replyDiscord(`Successfully logged on as \`${this.steamUser.steamID.getSteamID64()}\`!`);

          // Start playing games
          this.steamUser.gamesPlayed(shuffleArray(this.getGames()));
          this.replyDiscord(`Started playing \`${JSON.stringify(this.getGames())}\`!`);

          this.setStatus(STEAM_BOT_STATUS.BOOST_STARTED);
          break;
        default:
          this.setStatus(STEAM_BOT_STATUS.UnhandledLoggedInEvent(details?.eresult));
          logger.warn(`${this.getUsername()} | Unhandled eresult loggedOn event: (${details?.eresult}) - ${details}`);

          this.replyDiscord(`Unhandled logged on event: (${details?.eresult})`);
          break;
      }
    } catch (error) {
      logger.error(`${this.getUsername()} | ${error}`);
      this.setError(STEAM_BOT_STATUS.Error(error));

      this.replyDiscord('Error after logging in!');
    }
  }

  onSteamGuardAuth() {
    this.setStatus(STEAM_BOT_STATUS.STEAM_GUARD_REQUIRED);

    this.start();
  }

  onPlayingState(blocked, playingApp) {
    if (blocked) {
      this.replyDiscord(`Game is being played in another session (AppID is ${playingApp})`);

      this.setStatus(STEAM_BOT_STATUS.BlockedFromPlayingGames(playingApp));
    }
  }

  onVacBans(numBans, appids) {
    if (numBans > 0) {
      this.setVacStatus({ numBans, appids });
    }
  }

  async onError(error) {
    try {
      this.setError(STEAM_BOT_STATUS.Error(error));
      await this.setIsRunning(false);

      // Reset steam guard auth to null
      this.setSteamGuardAuth(null);

      switch (error.eresult) {
        case SteamUser.EResult.InvalidPassword:
          this.replyDiscord('ERROR: Invalid password!');

          this.setError(STEAM_BOT_STATUS.INVALID_PASSWORD);
          this.stop();

          this.replyDiscord('Boost stopped! WARNING: Please check your password as soon as possible!');
          return;
        case SteamUser.EResult.LoggedInElsewhere:
          this.setError(STEAM_BOT_STATUS.ERROR_LOGGED_IN_ELSEWHERE);

          this.replyDiscord('ERROR: Logged in elsewhere!');
          break;
        case SteamUser.EResult.AccountLogonDenied:
          this.setError(STEAM_BOT_STATUS.STEAM_GUARD_REQUIRED);

          this.replyDiscord('ERROR: Steam Guard required!');
          break;
        case SteamUser.EResult.AccountHasBeenDeleted:
          this.setError(STEAM_BOT_STATUS.ERROR_ACCOUNT_DELETED);

          this.replyDiscord('ERROR: Account has been deleted!');

          this.stop();
          return;
        case SteamUser.EResult.LogonSessionReplaced:
          this.setError(STEAM_BOT_STATUS.ERROR_LOGON_SESSION_REPLACED);

          this.replyDiscord('ERROR: Logon session replaced!');
          break;
        default:
          this.setRefreshToken('');
          this.setError(STEAM_BOT_STATUS.Error(error));
          logger.warn(`${this.getUsername()} | ERROR: Unhandled eresult error event: ${error?.message} (${error?.eresult}) - ${error}`);

          this.replyDiscord(`ERROR: Unhandled error event: ${error?.message} (${error?.eresult})`);
          break;
      }

      this.replyDiscord('Reconnecting in 40 minutes...');

      // Retry login after 40 minutes
      setTimeout(() => {
        this.replyDiscord('Reconnecting...');

        this.start();
      }, 40 * 60 * 1000);
    } catch (err) {
      logger.error(`${this.getUsername()} | ${err}`);
      this.setError(STEAM_BOT_STATUS.Error(err));

      this.replyDiscord('Error!');
    }
  }

  async onDisconnected() {
    this.setStatus(STEAM_BOT_STATUS.DISCONNECTED);

    if (!this.#toBeRemoved) {
      await this.setIsRunning(false);
      // Reset steam guard auth to null
      this.setSteamGuardAuth(null);
    }

    if (this.#toBeRestarted) {
      this.#toBeRestarted = false;
      await this.setIsRunning(false);
      // Reset steam guard auth to null
      this.setSteamGuardAuth(null);

      this.start();
    }
  }
}

module.exports = SteamBot;
