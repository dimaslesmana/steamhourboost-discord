/**
 * * Regex match letters and numbers
 *
 * * /^[a-zA-Z0-9]+$/g
 */

/**
 * * Regex match only numbers
 *
 * * /^[0-9]+$/g
 */

/**
 * * Regex match license key
 * * License format (XXXX-XXXX-XXXX-XXXX), combination of letters and numbers
 *
 * * /^(([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4}))+$/g
 */

module.exports = (args, type) => {
  switch (type) {
    case 'start-stop':
      // return if no arguments provided
      if (!args.length) return false;
      if (!args[0]) return false;
      // too many arguments
      if (args.length > 1) return false;

      return true;
    case 'license':
      // return if no arguments provided
      if (!args.length) return false;
      if (!args[1]) return false;
      // too many arguments
      if (args.length > 2) return false;

      // return if arguments is not number
      if (!args[1].match(/^(([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4}))+$/g)) return false;

      return true;
    case 'account':
      // return if no arguments provided
      if (!args.length) return false;
      if (!args[0]) return false;
      // username is required
      if (!args[1]) return false;
      // too many arguments
      if (args.length > 4) return false;

      return true;
    case 'manage':
      // return if no arguments provided
      if (!args.length) return false;
      if (!args[0]) return false;
      // username is required
      if (!args[1]) return false;
      // argument is required
      if (!args[2]) return false;
      // too many arguments
      if (args.length > 3) return false;

      return true;
    case '2fa':
      // return if no arguments provided
      if (!args.length) return false;
      // username required
      if (!args[0]) return false;
      // 2fa code is required
      if (!args[1]) return false;
      // too many arguments
      if (args.length > 2) return false;

      return true;
  }
};