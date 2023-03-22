const STEAM_BOT_STATUS = {
  Error: (error) => ({ code: -1, message: 'error', error }),
  IDLE: { code: 0, message: 'idle' },
  LOGGED_IN: { code: 1, message: 'logged_in' },
  LOGGED_OUT: { code: 2, message: 'logged_out' },
  LOGGING_IN: { code: 3, message: 'logging_in' },
  LOGGING_OUT: { code: 4, message: 'logging_out' },
  BOOST_STARTED: { code: 5, message: 'online_status_set_and_games_played' },
  LOGIN_ERROR: { code: 6, message: 'error_on_login' },
  LOGOUT_ERROR: { code: 7, message: 'error_on_logout' },
  STEAM_GUARD_REQUIRED: { code: 8, message: 'steam_guard_auth_required' },
  BlockedFromPlayingGames: (appId) => ({ code: 9, message: 'game_played_on_another_session', appId }),
  UnhandledLoggedInEvent: (eresult) => ({ code: 10, message: 'unhandled_logged_in_event', details: eresult }),
  ERROR_ACCOUNT_DELETED: { code: 11, message: 'account_deleted' },
  ERROR_LOGGED_IN_ELSEWHERE: { code: 12, message: 'logged_in_elsewhere' },
  INVALID_PASSWORD: { code: 14, message: 'invalid_password' },
  RELOGIN: { code: 15, message: 'relogin' },
  RELOGIN_ERROR: { code: 16, message: 'error_on_relogin' },
  DISCONNECTED: { code: 17, message: 'disconnected' },
  RESTART: { code: 18, message: 'restart' },
  RESTART_ERROR: { code: 19, message: 'error_on_restart' },
  ERROR_LOGON_SESSION_REPLACED: { code: 20, message: 'logon_session_replaced' },
};

const MAX_STEAM_USERNAME_LENGTH = 64;
const MAX_STEAM_PASSWORD_LENGTH = 64;

const LICENSE_TYPE = {
  FREE: {
    id: 'L001',
    name: 'Free',
    maxSteamAccounts: 1,
    maxSteamGames: 1,
  },
  PREMIUM: {
    id: 'L002',
    name: 'Premium',
    maxSteamAccounts: 100,
    maxSteamGames: 30,
  },
};

module.exports = {
  STEAM_BOT_STATUS,
  LICENSE_TYPE,
  MAX_STEAM_USERNAME_LENGTH,
  MAX_STEAM_PASSWORD_LENGTH,
};
