const todoService = require('../services/todoService');

const getTodos = async (req, res, next) => {
  try {
    const { status, categoryId } = req.query;
    const todos = await todoService.getTodos(req.user.userId, { status, categoryId });
    res.json(todos);
  } catch (err) {
    next(err);
  }
};

const createTodo = async (req, res, next) => {
  try {
    const { title, description, categoryId, dueDate } = req.body;
    const todo = await todoService.createTodo(req.user.userId, { title, description, categoryId, dueDate });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, dueDate, isCompleted } = req.body;
    const todo = await todoService.updateTodo(req.user.userId, id, { title, description, categoryId, dueDate, isCompleted });
    res.json(todo);
  } catch (err) {
    next(err);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    await todoService.deleteTodo(req.user.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
