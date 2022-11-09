const { loggers, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const loggerFormat = printf(({ level, message, timestamp: ts }) => `[${ts} - ${level.toUpperCase()}] ${message}`);

const timezoned = () => {
  const datetime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  // Format to YYYY-MM-DD HH:mm:ss timezone
  return datetime.replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+) (.+)/, '$3-$1-$2 $4:$5:$6 $7');
};

module.exports = () => {
  loggers.add('default', {
    level: 'info',
    exitOnError: true,
    format: combine(
      timestamp({ format: timezoned }),
      loggerFormat,
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: './logs/combined.log' }),
    ],
  });

  process.on('uncaughtException', (error) => {
    loggers.get('default').error(error);
    process.exitCode = 1;
  });

  process.on('unhandledRejection', (error) => {
    loggers.get('default').error(error);
    process.exitCode = 1;
  });
};
