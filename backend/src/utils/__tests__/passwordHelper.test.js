const { hashPassword, comparePassword } = require('../passwordHelper');

describe('passwordHelper', () => {
  describe('hashPassword', () => {
    test('bcrypt 해시 반환 (평문과 다름)', async () => {
      const hash = await hashPassword('mypassword123');

      expect(hash).not.toBe('mypassword123');
      expect(typeof hash).toBe('string');
    });

    test('cost factor 12 적용 확인 (해시 접두사 $2b$12$)', async () => {
      const hash = await hashPassword('testpassword');

      expect(hash.startsWith('$2b$12$')).toBe(true);
    });

    test('같은 비밀번호도 매번 다른 해시 생성 (salt)', async () => {
      const hash1 = await hashPassword('samepassword');
      const hash2 = await hashPassword('samepassword');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    test('올바른 비밀번호 → true 반환', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await comparePassword('correctpassword', hash);

      expect(result).toBe(true);
    });

    test('잘못된 비밀번호 → false 반환', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await comparePassword('wrongpassword', hash);

      expect(result).toBe(false);
    });

    test('반환값이 boolean 타입', async () => {
      const hash = await hashPassword('password123');
      const trueResult = await comparePassword('password123', hash);
      const falseResult = await comparePassword('wrong', hash);

      expect(typeof trueResult).toBe('boolean');
      expect(typeof falseResult).toBe('boolean');
    });

    test('빈 문자열 비밀번호 → false 반환', async () => {
      const hash = await hashPassword('password123');
      const result = await comparePassword('', hash);

      expect(result).toBe(false);
    });
  });
});
