const { verifyToken } = require('../utils/jwtHelper');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: '인증 토큰이 필요합니다',
      },
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId };
    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: '유효하지 않거나 만료된 토큰입니다',
      },
    });
  }
};

module.exports = authMiddleware;
