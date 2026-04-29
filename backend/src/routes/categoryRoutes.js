const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

router.use(authMiddleware);

router.get('/', categoryController.getCategories);

router.post(
  '/',
  validateRequest({
    body: { name: { required: true, type: 'string', maxLength: 50 } },
  }),
  categoryController.createCategory,
);

router.patch(
  '/:id',
  validateRequest({
    body: { name: { required: true, type: 'string', maxLength: 50 } },
  }),
  categoryController.updateCategory,
);

router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
