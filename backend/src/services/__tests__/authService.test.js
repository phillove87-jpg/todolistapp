jest.mock('../../repositories/userRepository');
jest.mock('../../utils/passwordHelper');
jest.mock('../../utils/jwtHelper');

const userRepository = require('../../repositories/userRepository');
const { hashPassword, comparePassword } = require('../../utils/passwordHelper');
const { signAccessToken, signRefreshToken, verifyToken } = require('../../utils/jwtHelper');
const { register, login, refreshAccessToken } = require('../authService');

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    test('신규 이메일 → 사용자 생성 후 반환', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed_pw');
      userRepository.createUser.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', createdAt: new Date() });

      const result = await register('test@test.com', 'password123');

      expect(userRepository.createUser).toHaveBeenCalledWith('test@test.com', 'hashed_pw');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    test('중복 이메일 → 409 Conflict 에러 throw', async () => {
      userRepository.getUserByEmail.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      await expect(register('dup@test.com', 'password123')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    test('응답에 password 필드 미포함', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed_pw');
      userRepository.createUser.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', createdAt: new Date() });

      const result = await register('test@test.com', 'password123');

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    test('올바른 자격증명 → accessToken + refreshToken + user 반환', async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.com', password: 'hashed_pw', createdAt: new Date(),
      });
      comparePassword.mockResolvedValue(true);
      signAccessToken.mockReturnValue('access.token');
      signRefreshToken.mockReturnValue('refresh.token');

      const result = await login('test@test.com', 'password123');

      expect(result).toEqual({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
        user: expect.objectContaining({ id: 'uuid-1', email: 'test@test.com' }),
      });
    });

    test('존재하지 않는 이메일 → 401 에러 throw', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      await expect(login('nouser@test.com', 'pw')).rejects.toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });

    test('잘못된 비밀번호 → 401 에러 throw', async () => {
      userRepository.getUserByEmail.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', password: 'hashed' });
      comparePassword.mockResolvedValue(false);

      await expect(login('test@test.com', 'wrongpw')).rejects.toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });

    test('응답 user 객체에 password 미포함', async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.com', password: 'hashed_pw', createdAt: new Date(),
      });
      comparePassword.mockResolvedValue(true);
      signAccessToken.mockReturnValue('access.token');
      signRefreshToken.mockReturnValue('refresh.token');

      const result = await login('test@test.com', 'password123');

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('refreshAccessToken', () => {
    test('유효한 refreshToken → 새 accessToken 반환', async () => {
      verifyToken.mockReturnValue({ userId: 'uuid-1' });
      signAccessToken.mockReturnValue('new.access.token');

      const result = await refreshAccessToken('valid.refresh.token');

      expect(result).toEqual({ accessToken: 'new.access.token' });
    });

    test('만료된 refreshToken → 401 에러 throw', async () => {
      verifyToken.mockImplementation(() => { throw new Error('jwt expired'); });

      await expect(refreshAccessToken('expired.token')).rejects.toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });
  });
});
