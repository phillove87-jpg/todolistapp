jest.mock('../../repositories/todoRepository');

const todoRepository = require('../../repositories/todoRepository');
const { calculateStatus, getTodos, createTodo, updateTodo, deleteTodo } = require('../todoService');

const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';
const TODO_ID = 'todo-uuid-1';

const makeTodo = (overrides = {}) => ({
  id: TODO_ID,
  title: '테스트 할일',
  description: null,
  userId: USER_ID,
  categoryId: null,
  dueDate: null,
  isCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('todoService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('calculateStatus', () => {
    test('isCompleted=true → "completed"', () => {
      expect(calculateStatus(true, null)).toBe('completed');
    });

    test('isCompleted=true, 과거 마감일 → "completed"', () => {
      const past = new Date(Date.now() - 86400000);
      expect(calculateStatus(true, past)).toBe('completed');
    });

    test('isCompleted=false, dueDate=null → "in_progress"', () => {
      expect(calculateStatus(false, null)).toBe('in_progress');
    });

    test('isCompleted=false, 미래 마감일 → "in_progress"', () => {
      const future = new Date(Date.now() + 86400000);
      expect(calculateStatus(false, future)).toBe('in_progress');
    });

    test('isCompleted=false, 과거 마감일 → "overdue"', () => {
      const past = new Date(Date.now() - 86400000);
      expect(calculateStatus(false, past)).toBe('overdue');
    });

    test('isCompleted=false, 현재 시각과 동일 → "overdue"', () => {
      const now = new Date(Date.now() - 1);
      expect(calculateStatus(false, now)).toBe('overdue');
    });
  });

  describe('getTodos', () => {
    test('본인 할일 목록 반환 + status 필드 포함', async () => {
      todoRepository.getTodosByUserId.mockResolvedValue([makeTodo()]);

      const todos = await getTodos(USER_ID, {});

      expect(todoRepository.getTodosByUserId).toHaveBeenCalledWith(USER_ID, {});
      expect(todos[0]).toHaveProperty('status', 'in_progress');
    });

    test('filters 전달', async () => {
      todoRepository.getTodosByUserId.mockResolvedValue([]);

      await getTodos(USER_ID, { status: 'overdue', categoryId: 'cat-1' });

      expect(todoRepository.getTodosByUserId).toHaveBeenCalledWith(USER_ID, { status: 'overdue', categoryId: 'cat-1' });
    });
  });

  describe('createTodo', () => {
    test('할일 생성 후 status 포함하여 반환', async () => {
      const todo = makeTodo({ title: '새 할일' });
      todoRepository.createTodo.mockResolvedValue(todo);

      const result = await createTodo(USER_ID, { title: '새 할일' });

      expect(todoRepository.createTodo).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID, title: '새 할일' }));
      expect(result).toHaveProperty('status');
    });
  });

  describe('updateTodo', () => {
    test('본인 할일 수정 성공', async () => {
      todoRepository.getTodoById.mockResolvedValue(makeTodo());
      todoRepository.updateTodo.mockResolvedValue(makeTodo({ title: '수정된 제목' }));

      const result = await updateTodo(USER_ID, TODO_ID, { title: '수정된 제목' });

      expect(result.title).toBe('수정된 제목');
      expect(result).toHaveProperty('status');
    });

    test('존재하지 않는 할일 → 404 에러 throw', async () => {
      todoRepository.getTodoById.mockResolvedValue(null);

      await expect(updateTodo(USER_ID, TODO_ID, {})).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    test('타인 할일 수정 → 403 에러 throw', async () => {
      todoRepository.getTodoById.mockResolvedValue(makeTodo({ userId: OTHER_USER_ID }));

      await expect(updateTodo(USER_ID, TODO_ID, {})).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });
  });

  describe('deleteTodo', () => {
    test('본인 할일 삭제 성공', async () => {
      todoRepository.getTodoById.mockResolvedValue(makeTodo());
      todoRepository.deleteTodo.mockResolvedValue(true);

      await expect(deleteTodo(USER_ID, TODO_ID)).resolves.toBeUndefined();
      expect(todoRepository.deleteTodo).toHaveBeenCalledWith(TODO_ID);
    });

    test('존재하지 않는 할일 → 404 에러 throw', async () => {
      todoRepository.getTodoById.mockResolvedValue(null);

      await expect(deleteTodo(USER_ID, TODO_ID)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    test('타인 할일 삭제 → 403 에러 throw', async () => {
      todoRepository.getTodoById.mockResolvedValue(makeTodo({ userId: OTHER_USER_ID }));

      await expect(deleteTodo(USER_ID, TODO_ID)).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });
  });
});
