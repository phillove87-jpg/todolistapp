const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * @param {string} password 평문 비밀번호
 * @returns {Promise<string>} bcrypt 해시 (cost 12)
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * @param {string} input 평문 비밀번호
 * @param {string} hash 저장된 해시
 * @returns {Promise<boolean>}
 */
const comparePassword = async (input, hash) => {
  return bcrypt.compare(input, hash);
};

module.exports = { hashPassword, comparePassword };
