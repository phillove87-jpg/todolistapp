const { Router } = require('express');
const todoController = require('../controllers/todoController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

router.use(authMiddleware);

router.get('/', todoController.getTodos);

router.post(
  '/',
  validateRequest({
    body: { title: { required: true, type: 'string', maxLength: 100 } },
  }),
  todoController.createTodo,
);

router.patch('/:id', todoController.updateTodo);

router.delete('/:id', todoController.deleteTodo);

module.exports = router;
