const { Router } = require('express');
const authRoutes = require('./authRoutes');
const todoRoutes = require('./todoRoutes');
const categoryRoutes = require('./categoryRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/todos', todoRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
