const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['body.password', 'body.email', '*.password', '*.email'],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
