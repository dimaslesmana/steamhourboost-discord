const BotStatus = {
  Error: (error) => ({ code: -1, message: 'error', error }),
  Idle: { code: 0, message: 'idle' },
  LoggedIn: { code: 1, message: 'logged_in' },
  LoggedOut: { code: 2, message: 'logged_out' },
  LoggingIn: { code: 3, message: 'logging_in' },
  LoggingOut: { code: 4, message: 'logging_out' },
  BoostStarted: { code: 5, message: 'online_status_set_and_games_played' },
  LoginError: { code: 6, message: 'error_on_login' },
  LogoutError: { code: 7, message: 'error_on_logout' },
  SteamGuardRequired: { code: 8, message: 'steam_guard_auth_required' },
  BlockedFromPlayingGames: (appId) => ({ code: 9, message: 'game_played_on_another_session', appId }),
  UnhandledLoggedInEvent: (eresult) => ({ code: 10, message: 'unhandled_logged_in_event', details: eresult }),
  ErrorAccountDeleted: { code: 11, message: 'account_deleted' },
  ErrorLoggedInElsewhere: { code: 12, message: 'logged_in_elsewhere' },
  InvalidLoginKey: { code: 13, message: 'invalid_login_key' },
  InvalidPassword: { code: 14, message: 'invalid_password' },
  Relogin: { code: 15, message: 'relogin' },
  ReloginError: { code: 16, message: 'error_on_relogin' },
  Disconnected: { code: 17, message: 'disconnected' },
};

const LicenseType = {
  Free: 'L001',
  Premium: 'L002',
};

module.exports = { BotStatus, LicenseType };
