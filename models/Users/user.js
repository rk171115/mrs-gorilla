const { pool } = require('../../db_conn');

class User {
  // Create a new user
  static async create(userData) {
    const query = `
      INSERT INTO users 
      (phone_number, full_name, email, is_verified) 
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      userData.phone_number,
      userData.full_name || null,
      userData.email || null,
      userData.is_verified || 0
    ]);
    
    return result.insertId;
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Find user by phone number
  static async findByPhone(phoneNumber) {
    const query = 'SELECT * FROM users WHERE phone_number = ?';
    const [rows] = await pool.query(query, [phoneNumber]);
    return rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows[0];
  }

  // Get all users
  static async findAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const [rows] = await pool.query(query);
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const fields = [];
    const values = [];
    
    // Dynamically build the update query based on provided fields
    if (userData.phone_number !== undefined) {
      fields.push('phone_number = ?');
      values.push(userData.phone_number);
    }
    
    if (userData.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(userData.full_name);
    }
    
    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    
    if (userData.is_verified !== undefined) {
      fields.push('is_verified = ?');
      values.push(userData.is_verified);
    }
    
    if (userData.last_login !== undefined) {
      fields.push('last_login = ?');
      values.push(userData.last_login);
    }
    
    // If no fields to update, return 0 affected rows
    if (fields.length === 0) {
      return 0;
    }
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  }

  // Update last login
  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  }

  // Set user as verified
  static async setVerified(id) {
    const query = 'UPDATE users SET is_verified = 1 WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  }

  // Search users
  static async search(searchTerm) {
    const query = `
      SELECT * FROM users 
      WHERE phone_number LIKE ? OR full_name LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.query(query, [searchPattern, searchPattern, searchPattern]);
    return rows;
  }
}

module.exports = User;