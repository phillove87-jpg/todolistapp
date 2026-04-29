jest.mock('../../utils/jwtHelper', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { verifyToken } = require('../../utils/jwtHelper');
const authMiddleware = require('../authMiddleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
    verifyToken.mockReset();
  });

  test('유효한 Bearer 토큰 → req.user 주입 후 next() 호출', () => {
    verifyToken.mockReturnValue({ userId: 'user-123' });
    const req = { headers: { authorization: 'Bearer valid.token.here' } };
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('valid.token.here');
    expect(req.user).toEqual({ userId: 'user-123' });
    expect(next).toHaveBeenCalled();
  });

  test('Authorization 헤더 없음 → 401 반환', () => {
    const req = { headers: {} };
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('Bearer 접두사 없음 → 401 반환', () => {
    const req = { headers: { authorization: 'Token somevalue' } };
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('만료된 토큰 (verifyToken throw) → 401 반환', () => {
    verifyToken.mockImplementation(() => { throw new Error('jwt expired'); });
    const req = { headers: { authorization: 'Bearer expired.token' } };
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: '유효하지 않거나 만료된 토큰입니다' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('위조된 토큰 (verifyToken throw) → 401 반환', () => {
    verifyToken.mockImplementation(() => { throw new Error('invalid signature'); });
    const req = { headers: { authorization: 'Bearer forged.token.value' } };
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('Authorization 헤더가 null인 경우 → 401 반환', () => {
    const req = { headers: { authorization: null } };
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
