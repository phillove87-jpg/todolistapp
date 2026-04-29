const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.corsOrigin.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: 허용되지 않은 출처입니다'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
