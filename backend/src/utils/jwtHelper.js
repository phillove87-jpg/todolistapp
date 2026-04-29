const jwt = require('jsonwebtoken');
const env = require('../config/env');

const validateSecret = () => {
  if (Buffer.byteLength(env.jwt.secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET은 최소 32바이트 이상이어야 합니다');
  }
};

/**
 * @param {string} userId
 * @returns {string} HS-512 서명된 Access Token (1h)
 */
const signAccessToken = (userId) => {
  validateSecret();
  return jwt.sign({ userId }, env.jwt.secret, {
    algorithm: 'HS512',
    expiresIn: env.jwt.accessExpires,
  });
};

/**
 * @param {string} userId
 * @returns {string} HS-512 서명된 Refresh Token (7d)
 */
const signRefreshToken = (userId) => {
  validateSecret();
  return jwt.sign({ userId }, env.jwt.secret, {
    algorithm: 'HS512',
    expiresIn: env.jwt.refreshExpires,
  });
};

/**
 * @param {string} token
 * @returns {Object} 디코딩된 payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyToken = (token) => {
  validateSecret();
  return jwt.verify(token, env.jwt.secret, { algorithms: ['HS512'] });
};

module.exports = { signAccessToken, signRefreshToken, verifyToken };
