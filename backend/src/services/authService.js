const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwtHelper');

const register = async (email, password) => {
  const existing = await userRepository.getUserByEmail(email);
  if (existing) {
    const err = new Error('이미 사용 중인 이메일입니다');
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  const hashed = await hashPassword(password);
  return userRepository.createUser(email, hashed);
};

const login = async (email, password) => {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    const err = new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const err = new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  return {
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken);
    return { accessToken: signAccessToken(decoded.userId) };
  } catch {
    const err = new Error('유효하지 않거나 만료된 리프레시 토큰입니다');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
};

module.exports = { register, login, refreshAccessToken };
