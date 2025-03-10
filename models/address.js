const { pool } = require('../db_conn');

class Address {
  static async create(addressData) {
    const query = `
      INSERT INTO addresses 
      (user_id, full_address, latitude, longitude, house_flat_number,
      apartment_society_road, address_tag, is_default, receiver_name, receiver_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      addressData.user_id,
      addressData.full_address,
      addressData.latitude,
      addressData.longitude,
      addressData.house_flat_number,
      addressData.apartment_society_road,
      addressData.address_tag,
      addressData.is_default,
      addressData.receiver_name,
      addressData.receiver_phone
    ]);
    
    return result.insertId;
  }
  
  static async findAll(userId) {
    const query = 'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC';
    const [rows] = await pool.query(query, [userId]);
    return rows;
  }
  
  static async findById(addressId, userId) {
    const query = 'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?';
    const [rows] = await pool.query(query, [addressId, userId]);
    return rows[0];
  }
  
  static async update(addressId, userId, addressData) {
    const setClause = Object.keys(addressData)
      .filter(key => key !== 'user_id' && key !== 'address_id') // Exclude these fields from updates
      .map(key => `${key} = ?`)
      .join(', ');
    
    const query = `UPDATE addresses SET ${setClause} WHERE address_id = ? AND user_id = ?`;
    
    const values = [
      ...Object.values(addressData).filter((_, index) => {
        const key = Object.keys(addressData)[index];
        return key !== 'user_id' && key !== 'address_id';
      }),
      addressId,
      userId
    ];
    
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }
  
  static async delete(addressId, userId) {
    const query = 'DELETE FROM addresses WHERE address_id = ? AND user_id = ?';
    const [result] = await pool.query(query, [addressId, userId]);
    return result.affectedRows;
  }
  
  static async setAllNotDefault(userId) {
    const query = 'UPDATE addresses SET is_default = FALSE WHERE user_id = ?';
    await pool.query(query, [userId]);
  }
  
  static async setDefault(addressId, userId) {
    const query = 'UPDATE addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?';
    const [result] = await pool.query(query, [addressId, userId]);
    return result.affectedRows;
  }
  
  static async countByUser(userId) {
    const query = 'SELECT COUNT(*) as count FROM addresses WHERE user_id = ?';
    const [rows] = await pool.query(query, [userId]);
    return rows[0].count;
  }
}

module.exports = Address;