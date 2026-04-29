jest.mock('../../repositories/categoryRepository');

const categoryRepository = require('../../repositories/categoryRepository');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../categoryService');

const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';
const CAT_ID = 'cat-uuid-1';

const makeCat = (overrides = {}) => ({
  id: CAT_ID,
  name: '업무',
  userId: USER_ID,
  createdAt: new Date(),
  ...overrides,
});

describe('categoryService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getCategories', () => {
    test('본인 카테고리 목록 반환', async () => {
      categoryRepository.getCategoriesByUserId.mockResolvedValue([makeCat()]);

      const result = await getCategories(USER_ID);

      expect(categoryRepository.getCategoriesByUserId).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('createCategory', () => {
    test('중복 없는 이름 → 카테고리 생성', async () => {
      categoryRepository.getCategoriesByUserId.mockResolvedValue([]);
      categoryRepository.createCategory.mockResolvedValue(makeCat());

      const result = await createCategory(USER_ID, '업무');

      expect(categoryRepository.createCategory).toHaveBeenCalledWith(USER_ID, '업무');
      expect(result.name).toBe('업무');
    });

    test('동일 사용자 중복 이름 → 409 에러 throw', async () => {
      categoryRepository.getCategoriesByUserId.mockResolvedValue([makeCat({ name: '업무' })]);

      await expect(createCategory(USER_ID, '업무')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    test('다른 사용자와 동일 이름은 허용 (다른 userId scope)', async () => {
      categoryRepository.getCategoriesByUserId.mockResolvedValue([]);
      categoryRepository.createCategory.mockResolvedValue(makeCat());

      await expect(createCategory(USER_ID, '업무')).resolves.toBeDefined();
    });
  });

  describe('updateCategory', () => {
    test('본인 카테고리 이름 변경 성공', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(makeCat());
      categoryRepository.getCategoriesByUserId.mockResolvedValue([makeCat()]);
      categoryRepository.updateCategory.mockResolvedValue(makeCat({ name: '개인' }));

      const result = await updateCategory(USER_ID, CAT_ID, '개인');

      expect(result.name).toBe('개인');
    });

    test('존재하지 않는 카테고리 → 404 에러 throw', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(null);

      await expect(updateCategory(USER_ID, CAT_ID, '새이름')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    test('타인 카테고리 수정 → 403 에러 throw', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(makeCat({ userId: OTHER_USER_ID }));

      await expect(updateCategory(USER_ID, CAT_ID, '새이름')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    test('중복 이름으로 변경 → 409 에러 throw', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(makeCat({ id: CAT_ID }));
      categoryRepository.getCategoriesByUserId.mockResolvedValue([
        makeCat({ id: CAT_ID, name: '업무' }),
        makeCat({ id: 'other-cat', name: '개인' }),
      ]);

      await expect(updateCategory(USER_ID, CAT_ID, '개인')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });
  });

  describe('deleteCategory', () => {
    test('본인 카테고리 삭제 성공', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(makeCat());
      categoryRepository.deleteCategory.mockResolvedValue(true);

      await expect(deleteCategory(USER_ID, CAT_ID)).resolves.toBeUndefined();
      expect(categoryRepository.deleteCategory).toHaveBeenCalledWith(CAT_ID);
    });

    test('존재하지 않는 카테고리 → 404 에러 throw', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(null);

      await expect(deleteCategory(USER_ID, CAT_ID)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    test('타인 카테고리 삭제 → 403 에러 throw', async () => {
      categoryRepository.getCategoryById.mockResolvedValue(makeCat({ userId: OTHER_USER_ID }));

      await expect(deleteCategory(USER_ID, CAT_ID)).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });
  });
});
