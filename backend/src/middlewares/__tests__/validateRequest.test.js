const validateRequest = require('../validateRequest');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validateRequest', () => {
  test('필수 필드 없음 → 400 VALIDATION_ERROR 반환', () => {
    const middleware = validateRequest({
      body: { title: { required: true, type: 'string' } },
    });
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'title은(는) 필수 항목입니다' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('maxLength 초과 → 400 반환', () => {
    const middleware = validateRequest({
      body: { title: { required: true, type: 'string', maxLength: 100 } },
    });
    const req = { body: { title: 'a'.repeat(101) } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'title은(는) 100자 이내여야 합니다' },
    });
  });

  test('minLength 미달 → 400 반환', () => {
    const middleware = validateRequest({
      body: { password: { required: true, type: 'string', minLength: 8 } },
    });
    const req = { body: { password: '1234567' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'password은(는) 8자 이상이어야 합니다' },
    });
  });

  test('잘못된 이메일 형식 → 400 반환', () => {
    const middleware = validateRequest({
      body: { email: { required: true, isEmail: true } },
    });
    const req = { body: { email: 'not-an-email' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'email은(는) 올바른 이메일 형식이어야 합니다' },
    });
  });

  test('유효한 요청 바디 → next() 호출', () => {
    const middleware = validateRequest({
      body: {
        email: { required: true, isEmail: true },
        password: { required: true, type: 'string', minLength: 8 },
      },
    });
    const req = { body: { email: 'user@example.com', password: 'password123' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('선택 필드가 없어도 next() 호출', () => {
    const middleware = validateRequest({
      body: { description: { type: 'string', maxLength: 500 } },
    });
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('title 100자 경계값 → next() 호출', () => {
    const middleware = validateRequest({
      body: { title: { required: true, type: 'string', maxLength: 100 } },
    });
    const req = { body: { title: 'a'.repeat(100) } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('빈 문자열 필수 필드 → 400 반환', () => {
    const middleware = validateRequest({
      body: { title: { required: true, type: 'string' } },
    });
    const req = { body: { title: '' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  describe('할일 제목 경계값 테스트 (BE-07)', () => {
    const titleSchema = { body: { title: { required: true, type: 'string', maxLength: 100 } } };

    test('0자 (빈 문자열) → 400 반환', () => {
      const middleware = validateRequest(titleSchema);
      const req = { body: { title: '' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('1자 → next() 호출', () => {
      const middleware = validateRequest(titleSchema);
      const req = { body: { title: 'a' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('100자 (최대) → next() 호출', () => {
      const middleware = validateRequest(titleSchema);
      const req = { body: { title: 'a'.repeat(100) } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('101자 (초과) → 400 반환', () => {
      const middleware = validateRequest(titleSchema);
      const req = { body: { title: 'a'.repeat(101) } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
