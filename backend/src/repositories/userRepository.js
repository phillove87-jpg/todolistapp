const db = require('../db/dbClient');

/**
 * Get user by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getUserById = async (id) => {
  const query = 'SELECT id, email, created_at FROM users WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;
  
  return {
    id: rows[0].id,
    email: rows[0].email,
    createdAt: rows[0].created_at,
  };
};

/**
 * Get user by email
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
const getUserByEmail = async (email) => {
  const query = 'SELECT id, email, password, created_at FROM users WHERE email = $1';
  const { rows } = await db.query(query, [email]);
  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    email: rows[0].email,
    password: rows[0].password,
    createdAt: rows[0].created_at,
  };
};

/**
 * Create a new user
 * @param {string} email 
 * @param {string} hashedPassword 
 * @returns {Promise<Object>}
 */
const createUser = async (email, hashedPassword) => {
  const query = `
    INSERT INTO users (email, password)
    VALUES ($1, $2)
    RETURNING id, email, created_at
  `;
  const { rows } = await db.query(query, [email, hashedPassword]);
  
  return {
    id: rows[0].id,
    email: rows[0].email,
    createdAt: rows[0].created_at,
  };
};

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
};
