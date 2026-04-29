const todoRepository = require('../repositories/todoRepository');

const calculateStatus = (isCompleted, dueDate) => {
  if (isCompleted) return 'completed';
  if (!dueDate) return 'in_progress';
  return new Date(dueDate) <= new Date() ? 'overdue' : 'in_progress';
};

const getTodos = async (userId, filters = {}) => {
  const todos = await todoRepository.getTodosByUserId(userId, filters);
  return todos.map(todo => ({ ...todo, status: calculateStatus(todo.isCompleted, todo.dueDate) }));
};

const createTodo = async (userId, todoData) => {
  const todo = await todoRepository.createTodo({ ...todoData, userId });
  return { ...todo, status: calculateStatus(todo.isCompleted, todo.dueDate) };
};

const updateTodo = async (userId, todoId, todoData) => {
  const existing = await todoRepository.getTodoById(todoId);
  if (!existing) {
    const err = new Error('할일을 찾을 수 없습니다');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.userId !== userId) {
    const err = new Error('이 할일을 수정할 권한이 없습니다');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const updated = await todoRepository.updateTodo(todoId, todoData);
  return { ...updated, status: calculateStatus(updated.isCompleted, updated.dueDate) };
};

const deleteTodo = async (userId, todoId) => {
  const existing = await todoRepository.getTodoById(todoId);
  if (!existing) {
    const err = new Error('할일을 찾을 수 없습니다');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.userId !== userId) {
    const err = new Error('이 할일을 삭제할 권한이 없습니다');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  await todoRepository.deleteTodo(todoId);
};

module.exports = { calculateStatus, getTodos, createTodo, updateTodo, deleteTodo };
