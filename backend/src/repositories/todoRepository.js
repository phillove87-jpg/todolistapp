const db = require('../db/dbClient');

/**
 * Get todos by user ID with optional filters
 * @param {string} userId
 * @param {Object} filters { categoryId, status }
 * @returns {Promise<Array>}
 */
const getTodosByUserId = async (userId, filters = {}) => {
  let query = 'SELECT * FROM todos WHERE user_id = $1';
  const params = [userId];
  let idx = 2;

  if (filters.categoryId) {
    query += ` AND category_id = $${idx++}`;
    params.push(filters.categoryId);
  }

  if (filters.status === 'completed') {
    query += ' AND is_completed = true';
  } else if (filters.status === 'overdue') {
    query += ' AND is_completed = false AND due_date <= NOW()';
  } else if (filters.status === 'in_progress') {
    query += ' AND is_completed = false AND (due_date IS NULL OR due_date > NOW())';
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await db.query(query, params);

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    categoryId: row.category_id,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Get todo by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const getTodoById = async (id) => {
  const { rows } = await db.query('SELECT * FROM todos WHERE id = $1', [id]);
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    categoryId: row.category_id,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Create a new todo
 * @param {Object} todoData
 * @returns {Promise<Object>}
 */
const createTodo = async (todoData) => {
  const { title, description, userId, categoryId, dueDate } = todoData;
  const query = `
    INSERT INTO todos (title, description, user_id, category_id, due_date)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await db.query(query, [title, description || null, userId, categoryId || null, dueDate || null]);
  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    categoryId: row.category_id,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Update a todo (only provided fields)
 * @param {string} id
 * @param {Object} todoData
 * @returns {Promise<Object|null>}
 */
const updateTodo = async (id, todoData) => {
  const columnMap = {
    title: 'title',
    description: 'description',
    categoryId: 'category_id',
    dueDate: 'due_date',
    isCompleted: 'is_completed',
  };

  const fields = [];
  const params = [];
  let idx = 1;

  for (const [key, col] of Object.entries(columnMap)) {
    if (todoData[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      params.push(todoData[key]);
    }
  }

  if (fields.length === 0) return getTodoById(id);

  params.push(id);
  const { rows } = await db.query(
    `UPDATE todos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    params,
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    categoryId: row.category_id,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Delete a todo (hard delete)
 * @param {string} id
 * @returns {Promise<boolean>}
 */
const deleteTodo = async (id) => {
  const { rowCount } = await db.query('DELETE FROM todos WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { getTodosByUserId, getTodoById, createTodo, updateTodo, deleteTodo };
