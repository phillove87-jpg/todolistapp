const TEST_SECRET = 'test_secret_key_that_is_at_least_32_bytes_long_for_testing';

jest.mock('../../config/env', () => ({
  jwt: {
    secret: TEST_SECRET,
    accessExpires: '1h',
    refreshExpires: '7d',
  },
  db: {},
  port: 3000,
  nodeEnv: 'test',
  corsOrigin: 'http://localhost:5173',
}));

const jwt = require('jsonwebtoken');
const { signAccessToken, signRefreshToken, verifyToken } = require('../jwtHelper');

describe('jwtHelper', () => {
  describe('signAccessToken', () => {
    test('HS512 알고리즘으로 서명된 토큰 반환', () => {
      const token = signAccessToken('user-123');
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).toBe('HS512');
    });

    test('페이로드에 userId, iat, exp 포함', () => {
      const token = signAccessToken('user-456');
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('userId', 'user-456');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('만료 시간이 1시간으로 설정됨', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = signAccessToken('user-123');
      const after = Math.floor(Date.now() / 1000);
      const decoded = jwt.decode(token);

      const expectedExpMin = before + 3600;
      const expectedExpMax = after + 3600;
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpMin);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpMax);
    });
  });

  describe('signRefreshToken', () => {
    test('HS512 알고리즘으로 서명된 토큰 반환', () => {
      const token = signRefreshToken('user-123');
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).toBe('HS512');
    });

    test('페이로드에 userId, iat, exp 포함', () => {
      const token = signRefreshToken('user-789');
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('userId', 'user-789');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('만료 시간이 7일로 설정됨', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = signRefreshToken('user-123');
      const after = Math.floor(Date.now() / 1000);
      const decoded = jwt.decode(token);

      const sevenDays = 7 * 24 * 3600;
      expect(decoded.exp).toBeGreaterThanOrEqual(before + sevenDays);
      expect(decoded.exp).toBeLessThanOrEqual(after + sevenDays);
    });

    test('Access Token과 Refresh Token의 만료 시간이 다름', () => {
      const accessToken = signAccessToken('user-123');
      const refreshToken = signRefreshToken('user-123');
      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyToken', () => {
    test('유효한 토큰 → payload 반환', () => {
      const token = signAccessToken('user-123');
      const payload = verifyToken(token);

      expect(payload).toHaveProperty('userId', 'user-123');
    });

    test('만료된 토큰 → 에러 throw', () => {
      const token = jwt.sign({ userId: 'user-123' }, TEST_SECRET, {
        algorithm: 'HS512',
        expiresIn: '-1s',
      });

      expect(() => verifyToken(token)).toThrow();
    });

    test('위조된 토큰 → 에러 throw', () => {
      expect(() => verifyToken('forged.token.value')).toThrow();
    });

    test('다른 알고리즘으로 서명된 토큰 → 에러 throw', () => {
      const token = jwt.sign({ userId: 'user-123' }, TEST_SECRET, { algorithm: 'HS256' });

      expect(() => verifyToken(token)).toThrow();
    });
  });

  describe('JWT_SECRET 검증', () => {
    test('32바이트 미만 시크릿 → 에러 throw', () => {
      const mockEnv = require('../../config/env');
      const originalSecret = mockEnv.jwt.secret;
      mockEnv.jwt.secret = 'short';

      expect(() => signAccessToken('user')).toThrow('JWT_SECRET은 최소 32바이트 이상이어야 합니다');
      expect(() => signRefreshToken('user')).toThrow('JWT_SECRET은 최소 32바이트 이상이어야 합니다');
      expect(() => verifyToken('sometoken')).toThrow('JWT_SECRET은 최소 32바이트 이상이어야 합니다');

      mockEnv.jwt.secret = originalSecret;
    });

    test('32바이트 이상 시크릿 → 정상 동작', () => {
      expect(() => signAccessToken('test')).not.toThrow();
    });
  });
});
