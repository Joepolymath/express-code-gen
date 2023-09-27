require('express-async-errors');
const winston = require('winston');

const logging = () => {
  winston.exceptions.handle(
    new winston.transports.Console({ colorize: true, prettyPrint: true })
  );

  process.on('unhandledRejection', (err) => {
    winston.error(err.message, err);
    process.exit(1);
  });

  winston.configure({
    transports: [new winston.transports.Console()],
  });
};

module.exports = logging;
