const categoryRepository = require('../repositories/categoryRepository');

const getCategories = async (userId) => {
  return categoryRepository.getCategoriesByUserId(userId);
};

const createCategory = async (userId, name) => {
  const categories = await categoryRepository.getCategoriesByUserId(userId);
  const duplicate = categories.find(c => c.name === name);
  if (duplicate) {
    const err = new Error('이미 사용 중인 카테고리 이름입니다');
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }
  return categoryRepository.createCategory(userId, name);
};

const updateCategory = async (userId, categoryId, name) => {
  const existing = await categoryRepository.getCategoryById(categoryId);
  if (!existing) {
    const err = new Error('카테고리를 찾을 수 없습니다');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.userId !== userId) {
    const err = new Error('이 카테고리를 수정할 권한이 없습니다');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const categories = await categoryRepository.getCategoriesByUserId(userId);
  const duplicate = categories.find(c => c.name === name && c.id !== categoryId);
  if (duplicate) {
    const err = new Error('이미 사용 중인 카테고리 이름입니다');
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  return categoryRepository.updateCategory(categoryId, name);
};

const deleteCategory = async (userId, categoryId) => {
  const existing = await categoryRepository.getCategoryById(categoryId);
  if (!existing) {
    const err = new Error('카테고리를 찾을 수 없습니다');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.userId !== userId) {
    const err = new Error('이 카테고리를 삭제할 권한이 없습니다');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  await categoryRepository.deleteCategory(categoryId);
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
