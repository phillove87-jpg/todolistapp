const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const db = require('./db/dbClient');

const start = async () => {
  await db.query('SELECT NOW()');
  logger.info('Database connection successful');

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
  });
};

start().catch(err => {
  logger.error(err, 'Server startup failed');
  process.exit(1);
});
