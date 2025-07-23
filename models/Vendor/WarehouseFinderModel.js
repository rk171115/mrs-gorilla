const { pool } = require('../../db_conn');

class WarehouseFinderModel {
  /**
   * Find a warehouse based on latitude and longitude coordinates using min/max boundaries
   * @param {number} lat - User's latitude
   * @param {number} lng - User's longitude
   * @returns {Promise<Object|null>} - Warehouse information or null if not found
   */

// SIMPLEST APPROACH - Just get all vendors and calculate distance in JavaScript
static async findNearestAvailableVendor(userLat, userLng) {
  try {
    // Get all available vendors
    const query = `
      SELECT id, vendor_id, latitude, longitude, status
      FROM vendor_updates
      WHERE status = 'available'
    `;
    


const result = await pool.query(query);
console.log('Result structure:', result);
console.log('Vendors data:', result[0] || result);
    const [vendors] = await pool.query(query);
console.log('moghitn not hwre');
console.log([vendors]);
console.log('mohit here cool');
    
    if (vendors.length === 0) {
      // Try busy vendors if no available ones
      const busyQuery = `
        SELECT id, vendor_id, latitude, longitude, status, inventory, session_id, created_at
        FROM vendor_updates
        WHERE status = 'busy'
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
      `;
      const [busyVendors] = await pool.query(busyQuery);
      if (busyVendors.length === 0) return null;
      vendors = busyVendors;
    }
    
    // Find nearest vendor using simple math
    let nearest = null;
    let minDistance = Infinity;
    
    for (const vendor of vendors) {
      // Simple distance calculation (good enough for most cases)
      const latDiff = userLat - vendor.latitude;
      const lngDiff = userLng - vendor.longitude;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = vendor;
      }
    }
    
    return nearest;
    
  } catch (error) {
    console.error("Error finding nearest vendor:", error);
    throw error;
  }
}
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lng1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lng2 - Longitude of point 2
   * @returns {number} - Distance in kilometers
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} - Radians
   */
  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }










  static async findWarehouseByLocation(lat, lng) {
    try {
      const query = `
        SELECT 
          id,
          warehouse_Name,
          latitude,
          longitude,
          Address,
          min_lat,
          max_lat,
          min_lng,
          max_lng,
          created_at,
          updated_at
        FROM warehouse 
        WHERE ? BETWEEN min_lat AND max_lat 
        AND ? BETWEEN min_lng AND max_lng
        ORDER BY id ASC
        LIMIT 1
      `;
      
      const [warehouses] = await pool.query(query, [lat, lng]);
      return warehouses.length > 0 ? warehouses[0] : null;
    } catch (error) {
      console.error('Error finding warehouse by location:', error);
      throw error;
    }
  }

  /**
   * Get a specific warehouse by ID
   * @param {number} warehouseId - The ID of the warehouse
   * @returns {Promise<Object|null>} - Warehouse information or null if not found
   */
  static async getWarehouseById(warehouseId) {
    try {
      const query = `
        SELECT 
          id,
          warehouse_Name,
          latitude,
          longitude,
          Address,
          min_lat,
          max_lat,
          min_lng,
          max_lng,
          created_at,
          updated_at
        FROM warehouse 
        WHERE id = ?
        LIMIT 1
      `;
      
      const [warehouses] = await pool.query(query, [warehouseId]);
      return warehouses.length > 0 ? warehouses[0] : null;
    } catch (error) {
      console.error('Error finding warehouse by ID:', error);
      throw error;
    }
  }

  /**
   * Find vendors associated with a warehouse and matching the cart type
   * @param {number} warehouseId - The ID of the warehouse
   * @param {string} cartType - The type of cart (vegetable, fruit, fruit cart, customized card)
   * @returns {Promise<Array>} - List of matching vendors
   */
  static async findVendorsByWarehouseAndCartType(warehouseId, cartType) {
    try {
      const query = `
        SELECT 
          id, 
          Name, 
          warehouse_id,
          AadharNo,
          PanCardNo,
          Dl_no,
          cart_type, 
          fcm_token,
          Permanent_address,
          VehicleNo
        FROM vendor_details 
        WHERE warehouse_id = ? 
        AND LOWER(cart_type) = LOWER(?)
        ORDER BY Name ASC
      `;
      
      const [vendors] = await pool.query(query, [warehouseId, cartType]);
      return vendors;
    } catch (error) {
      console.error('Error finding vendors by warehouse and cart type:', error);
      throw error;
    }
  }

  /**
   * Get vendor statistics for a specific warehouse
   * @param {number} warehouseId - The ID of the warehouse
   * @returns {Promise<Object>} - Vendor statistics
   */
  static async getVendorStatsByWarehouse(warehouseId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_vendors,
          SUM(CASE WHEN LOWER(cart_type) = 'vegetable' THEN 1 ELSE 0 END) as vegetable_vendors,
          SUM(CASE WHEN LOWER(cart_type) = 'fruit' THEN 1 ELSE 0 END) as fruit_vendors,
          SUM(CASE WHEN LOWER(cart_type) = 'fruit cart' THEN 1 ELSE 0 END) as fruit_cart_vendors,
          SUM(CASE WHEN LOWER(cart_type) = 'customized cart' THEN 1 ELSE 0 END) as customized_cart_vendors
        FROM vendor_details 
        WHERE warehouse_id = ?
      `;
      
      const [stats] = await pool.query(query, [warehouseId]);
      return stats[0] || {
        total_vendors: 0,
        vegetable_vendors: 0,
        fruit_vendors: 0,
        fruit_cart_vendors: 0,
        customized_cart_vendors: 0
      };
    } catch (error) {
      console.error('Error getting vendor stats by warehouse:', error);
      throw error;
    }
  }

  /**
   * Get all warehouses with their service areas
   * @returns {Promise<Array>} - List of all warehouses with service areas
   */
  static async getAllWarehousesWithServiceAreas() {
    try {
      const query = `
        SELECT 
          id,
          warehouse_Name,
          latitude,
          longitude,
          Address,
          min_lat,
          max_lat,
          min_lng,
          max_lng,
          created_at,
          updated_at
        FROM warehouse 
        ORDER BY warehouse_Name ASC
      `;
      
      const [warehouses] = await pool.query(query);
      return warehouses;
    } catch (error) {
      console.error('Error getting all warehouses with service areas:', error);
      throw error;
    }
  }

  /**
   * Find all warehouses that serve a specific location (in case of overlapping service areas)
   * @param {number} lat - User's latitude
   * @param {number} lng - User's longitude
   * @returns {Promise<Array>} - List of warehouses serving the location
   */
  static async findAllWarehousesByLocation(lat, lng) {
    try {
      const query = `
        SELECT 
          id,
          warehouse_Name,
          latitude,
          longitude,
          Address,
          min_lat,
          max_lat,
          min_lng,
          max_lng
        FROM warehouse 
        WHERE ? BETWEEN min_lat AND max_lat 
        AND ? BETWEEN min_lng AND max_lng
        ORDER BY warehouse_Name ASC
      `;
      
      const [warehouses] = await pool.query(query, [lat, lng]);
      return warehouses;
    } catch (error) {
      console.error('Error finding all warehouses by location:', error);
      throw error;
    }
  }

  /**
   * Get detailed vendor information with warehouse details
   * @param {number} warehouseId - The ID of the warehouse
   * @param {string} cartType - The type of cart (optional)
   * @returns {Promise<Array>} - List of vendors with warehouse information
   */
  static async getVendorsWithWarehouseDetails(warehouseId, cartType = null) {
    try {
      let query = `
        SELECT 
          v.id,
          v.Name as vendor_name,
          v.warehouse_id,
          v.AadharNo,
          v.PanCardNo,
          v.Dl_no,
          v.cart_type,
          v.fcm_token,
          v.Permanent_address,
          v.VehicleNo,
          w.id as warehouse_id,
          w.warehouse_Name,
          w.Address as warehouse_address,
          w.latitude as warehouse_latitude,
          w.longitude as warehouse_longitude
        FROM vendor_details v
        JOIN warehouse w ON v.warehouse_id = w.id
        WHERE v.warehouse_id = ?
      `;
      
      const params = [warehouseId];
      
      if (cartType) {
        query += ` AND LOWER(v.cart_type) = LOWER(?)`;
        params.push(cartType);
      }
      
      query += ` ORDER BY v.Name ASC`;
      
      const [vendors] = await pool.query(query, params);
      return vendors;
    } catch (error) {
      console.error('Error getting vendors with warehouse details:', error);
      throw error;
    }
  }
}

module.exports = WarehouseFinderModel;
