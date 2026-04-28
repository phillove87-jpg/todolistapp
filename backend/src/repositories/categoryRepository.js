const db = require('../db/dbClient');

/**
 * Get categories by user ID
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
const getCategoriesByUserId = async (userId) => {
  const query = 'SELECT id, name, user_id, created_at FROM categories WHERE user_id = $1 ORDER BY created_at DESC';
  const { rows } = await db.query(query, [userId]);
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    userId: row.user_id,
    createdAt: row.created_at,
  }));
};

/**
 * Get category by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getCategoryById = async (id) => {
  const query = 'SELECT id, name, user_id, created_at FROM categories WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    name: rows[0].name,
    userId: rows[0].user_id,
    createdAt: rows[0].created_at,
  };
};

/**
 * Create a new category
 * @param {string} userId 
 * @param {string} name 
 * @returns {Promise<Object>}
 */
const createCategory = async (userId, name) => {
  const query = `
    INSERT INTO categories (user_id, name)
    VALUES ($1, $2)
    RETURNING id, name, user_id, created_at
  `;
  const { rows } = await db.query(query, [userId, name]);
  
  return {
    id: rows[0].id,
    name: rows[0].name,
    userId: rows[0].user_id,
    createdAt: rows[0].created_at,
  };
};

/**
 * Update a category
 * @param {string} id 
 * @param {string} name 
 * @returns {Promise<Object|null>}
 */
const updateCategory = async (id, name) => {
  const query = `
    UPDATE categories
    SET name = $1
    WHERE id = $2
    RETURNING id, name, user_id, created_at
  `;
  const { rows } = await db.query(query, [name, id]);
  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    name: rows[0].name,
    userId: rows[0].user_id,
    createdAt: rows[0].created_at,
  };
};

/**
 * Delete a category
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
const deleteCategory = async (id) => {
  const query = 'DELETE FROM categories WHERE id = $1';
  const { rowCount } = await db.query(query, [id]);
  return rowCount > 0;
};

module.exports = {
  getCategoriesByUserId,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
