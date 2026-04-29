const { Router } = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

router.post(
  '/register',
  validateRequest({
    body: {
      email: { required: true, isEmail: true },
      password: { required: true, type: 'string', minLength: 8 },
    },
  }),
  authController.register,
);

router.post(
  '/login',
  validateRequest({
    body: {
      email: { required: true, isEmail: true },
      password: { required: true },
    },
  }),
  authController.login,
);

router.post('/logout', authMiddleware, authController.logout);

router.post(
  '/refresh',
  validateRequest({ body: { refreshToken: { required: true } } }),
  authController.refresh,
);

module.exports = router;
