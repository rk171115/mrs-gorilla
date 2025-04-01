const { pool } = require('../../../db_conn');

class Warehouse {
   // Find nearest warehouse by calculating distance
   static async findNearestWarehouse(vendorLat, vendorLon) {
     try {
       const [warehouses] = await pool.execute(
         `SELECT
            id,
            warehouse_Name,
            latitude,
            longitude,
            Address,
           (6371 * ACOS(
             COS(RADIANS(?)) * COS(RADIANS(latitude)) *
              COS(RADIANS(longitude) - RADIANS(?)) +
              SIN(RADIANS(?)) * SIN(RADIANS(latitude))
           )) AS distance
         FROM warehouse
         ORDER BY distance
         LIMIT 1`,
         [vendorLat, vendorLon, vendorLat]
       );
        
       return warehouses[0] || null;
     } catch (error) {
       console.error('Error finding nearest warehouse:', error);
       throw error;
     }
   }

  // Create a new warehouse
  static async createWarehouse(warehouseData) {
    try {
      const [result] = await db.query(
        'INSERT INTO warehouse (warehouse_Name, latitude, longitude, Address) VALUES (?, ?, ?, ?)',
        [
          warehouseData.warehouse_Name, 
          warehouseData.latitude, 
          warehouseData.longitude, 
          warehouseData.Address
        ]
      );

      return {
        success: true,
        message: 'Warehouse created successfully',
        warehouseId: result.insertId
      };
    } catch (error) {
      console.error('Error creating warehouse:', error);
      return {
        success: false,
        message: 'Failed to create warehouse',
        error: error.message
      };
    }
  }

  // Get all warehouses
  static async getAllWarehouses() {
    try {
      const [warehouses] = await db.query('SELECT * FROM warehouse');
      return warehouses;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw error;
    }
  }

  // Update warehouse details
  static async updateWarehouse(id, warehouseData) {
    try {
      const [result] = await db.query(
        'UPDATE warehouse SET warehouse_Name = ?, latitude = ?, longitude = ?, Address = ? WHERE id = ?',
        [
          warehouseData.warehouse_Name, 
          warehouseData.latitude, 
          warehouseData.longitude, 
          warehouseData.Address,
          id
        ]
      );

      return {
        success: true,
        message: 'Warehouse updated successfully',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Error updating warehouse:', error);
      return {
        success: false,
        message: 'Failed to update warehouse',
        error: error.message
      };
    }
  }

  // Delete a warehouse
  static async deleteWarehouse(id) {
    try {
      const [result] = await db.query('DELETE FROM warehouse WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Warehouse deleted successfully',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      return {
        success: false,
        message: 'Failed to delete warehouse',
        error: error.message
      };
    }
  }
}

module.exports = Warehouse;