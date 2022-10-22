const { loggers, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

module.exports = () => {
  const loggerFormat = printf(({ level, message, timestamp: ts }) => `[${ts} - ${level.toUpperCase()}] ${message}`);

  loggers.add('default', {
    level: 'info',
    exitOnError: true,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
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
