const { loggers, format, transports } = require('winston');

const timestamp = require('../utils/timestamp.util');

const loggerFormat = format.printf(({ level, message, timestamp: ts }) => `[${ts} - ${level.toUpperCase()}] ${message}`);

module.exports = () => {
  loggers.add('default', {
    level: 'info',
    exitOnError: true,
    format: format.combine(
      format.timestamp({ format: timestamp }),
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
