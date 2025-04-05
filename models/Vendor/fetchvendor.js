const { pool } = require('../../db_conn');

// Helper method to construct full image URL
const getFullImageUrl = (relativePath) => {
  const BASE_URL = 'http://localhost:8000';
  // If no path or path is undefined, return null
  if (!relativePath) return null;
  // Ensure relativePath is a string and remove leading slash if present
  const cleanPath = String(relativePath).replace(/^\//, '');
  // Return full URL
  return `${BASE_URL}/${cleanPath}`;
};

class VendorModel {
  // Get basic vendor information for all vendors
  static async getVendorBasicInfo() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          va.emailId AS emailId,
          vd.Name AS name,
          va.phone_no AS phone_no,
          vd.Permanent_address AS address,
          vd.image_url AS image_url
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
      `);
      
      // Format image URLs for all vendors
      const formattedRows = rows.map(row => ({
        ...row,
        image_url: getFullImageUrl(row.image_url)
      }));
      
      return formattedRows;
    } finally {
      connection.release();
    }
  }

  // Get basic vendor information by vendor_details.id
  static async getVendorBasicInfoById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          vd.image_url AS image_url,
          va.vendorId AS vendorId,
          va.emailId AS emailId,
          vd.Name AS name,
          va.phone_no AS phone_no,
          vd.Permanent_address AS address
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
        WHERE vd.id = ?
      `, [id]);
      
      // Format image URL for the vendor
      if (rows.length > 0) {
        rows[0].image_url = getFullImageUrl(rows[0].image_url);
      }
      
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get vendor names and IDs for all vendors
  static async getVendorNameAndId() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          vd.Name AS name,
          vd.image_url AS image_url
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
      `);
      
      // Format image URLs for all vendors
      const formattedRows = rows.map(row => ({
        ...row,
        image_url: getFullImageUrl(row.image_url)
      }));
      
      return formattedRows;
    } finally {
      connection.release();
    }
  }

  // Get vendor name and ID by vendor_details.id
  static async getVendorNameAndIdById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          vd.Name AS name,
          vd.image_url AS image_url
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
        WHERE vd.id = ?
      `, [id]);
      
      // Format image URL for the vendor
      if (rows.length > 0) {
        rows[0].image_url = getFullImageUrl(rows[0].image_url);
      }
      
      return rows;
    } finally {
      connection.release();
    }
  }

  // Create new vendor
  static async createVendor(vendorData) {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // Insert into vendor_details table
      const [detailsResult] = await connection.query(`
        INSERT INTO vendor_details (Name, Permanent_address, image_url)
        VALUES (?, ?, ?)
      `, [vendorData.name, vendorData.address, vendorData.image_url || null]);

      const vendorDetailsId = detailsResult.insertId;
      
      // Create vendorId (could be a formatted version based on your requirements)
      const vendorId = vendorData.vendorId || `V${Date.now()}`;

      // Insert into vendor_auth table
      await connection.query(`
        INSERT INTO vendor_auth (vendor_details_id, vendorId, emailId, phone_no)
        VALUES (?, ?, ?, ?)
      `, [vendorDetailsId, vendorId, vendorData.emailId, vendorData.phone_no]);

      // Commit transaction
      await connection.commit();

      return {
        id: vendorDetailsId,
        vendorId,
        name: vendorData.name,
        image_url: getFullImageUrl(vendorData.image_url)
      };
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update vendor details
  static async updateVendor(id, vendorData) {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // Update vendor_details table
      if (vendorData.name || vendorData.address || vendorData.image_url !== undefined) {
        const updateFields = [];
        const updateValues = [];

        if (vendorData.name) {
          updateFields.push('Name = ?');
          updateValues.push(vendorData.name);
        }

        if (vendorData.address) {
          updateFields.push('Permanent_address = ?');
          updateValues.push(vendorData.address);
        }

        if (vendorData.image_url !== undefined) {
          updateFields.push('image_url = ?');
          updateValues.push(vendorData.image_url);
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          await connection.query(`
            UPDATE vendor_details
            SET ${updateFields.join(', ')}
            WHERE id = ?
          `, updateValues);
        }
      }

      // Update vendor_auth table
      if (vendorData.emailId || vendorData.phone_no || vendorData.vendorId) {
        const updateAuthFields = [];
        const updateAuthValues = [];

        if (vendorData.emailId) {
          updateAuthFields.push('emailId = ?');
          updateAuthValues.push(vendorData.emailId);
        }

        if (vendorData.phone_no) {
          updateAuthFields.push('phone_no = ?');
          updateAuthValues.push(vendorData.phone_no);
        }

        if (vendorData.vendorId) {
          updateAuthFields.push('vendorId = ?');
          updateAuthValues.push(vendorData.vendorId);
        }

        if (updateAuthFields.length > 0) {
          updateAuthValues.push(id);
          await connection.query(`
            UPDATE vendor_auth
            SET ${updateAuthFields.join(', ')}
            WHERE vendor_details_id = ?
          `, updateAuthValues);
        }
      }

      // Commit transaction
      await connection.commit();
      
      // Return updated vendor info
      const [updatedVendor] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          va.emailId AS emailId,
          vd.Name AS name,
          va.phone_no AS phone_no,
          vd.Permanent_address AS address,
          vd.image_url AS image_url
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
        WHERE vd.id = ?
      `, [id]);

      // Format image URL for the updated vendor
      if (updatedVendor.length > 0) {
        updatedVendor[0].image_url = getFullImageUrl(updatedVendor[0].image_url);
      }

      return updatedVendor[0];
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete vendor
  static async deleteVendor(id) {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // First delete from vendor_auth as it references vendor_details
      await connection.query(`
        DELETE FROM vendor_auth
        WHERE vendor_details_id = ?
      `, [id]);

      // Then delete from vendor_details
      const [result] = await connection.query(`
        DELETE FROM vendor_details
        WHERE id = ?
      `, [id]);

      // Commit transaction
      await connection.commit();

      return result.affectedRows > 0;
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = VendorModel;