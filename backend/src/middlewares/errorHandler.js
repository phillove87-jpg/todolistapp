const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || '서버 내부 오류가 발생했습니다';

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.url }, message);
  } else {
    logger.warn({ code, method: req.method, url: req.url }, message);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};

module.exports = errorHandler;
