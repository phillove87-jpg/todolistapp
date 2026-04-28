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
  let paramIndex = 2;

  if (filters.categoryId) {
    query += ` AND category_id = $${paramIndex++}`;
    params.push(filters.categoryId);
  }

  // status 필터는 Service 레이어에서 처리하는 것이 일반적이지만, 
  // 여기서는 간단한 is_completed 필터링만 예시로 포함
  if (filters.isCompleted !== undefined) {
    query += ` AND is_completed = $${paramIndex++}`;
    params.push(filters.isCompleted);
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
  const query = 'SELECT * FROM todos WHERE id = $1';
  const { rows } = await db.query(query, [id]);
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
  const { rows } = await db.query(query, [title, description, userId, categoryId, dueDate]);
  
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
 * Update a todo
 * @param {string} id 
 * @param {Object} todoData 
 * @returns {Promise<Object|null>}
 */
const updateTodo = async (id, todoData) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  Object.entries(todoData).forEach(([key, value]) => {
    // snake_case 변환
    const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    fields.push(`${dbKey} = $${paramIndex++}`);
    params.push(value);
  });

  if (fields.length === 0) return null;

  params.push(id);
  const query = `
    UPDATE todos
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const { rows } = await db.query(query, params);
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
 * Delete a todo
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
const deleteTodo = async (id) => {
  const query = 'DELETE FROM todos WHERE id = $1';
  const { rowCount } = await db.query(query, [id]);
  return rowCount > 0;
};

module.exports = {
  getTodosByUserId,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
