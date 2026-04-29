jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const errorHandler = require('../errorHandler');

const mockReq = () => ({ method: 'GET', url: '/api/test' });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  test('statusCode 있는 에러 → 해당 상태코드 반환', () => {
    const err = { statusCode: 404, code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다' };
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다' },
    });
  });

  test('statusCode 없는 에러 → 500 반환', () => {
    const err = new Error('예기치 않은 오류');
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: '예기치 않은 오류' },
    });
  });

  test('응답 형식이 {"error": {"code": ..., "message": ...}} 구조', () => {
    const err = { statusCode: 409, code: 'CONFLICT', message: '이미 존재합니다' };
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    const response = res.json.mock.calls[0][0];
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  });

  test('401 에러 처리', () => {
    const err = { statusCode: 401, code: 'UNAUTHORIZED', message: '인증이 필요합니다' };
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('403 에러 처리', () => {
    const err = { statusCode: 403, code: 'FORBIDDEN', message: '접근 권한이 없습니다' };
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
