
const { pool } = require('./db_conn');
const mysql = require('mysql2/promise');


const createTriggers = async () => {
    const triggerSQL = `
      CREATE TRIGGER IF NOT EXISTS update_daily_purchase_count 
      AFTER INSERT ON booking_details
      FOR EACH ROW
      BEGIN
        UPDATE item_promotion ip
        SET 
          times_purchased_today = times_purchased_today + NEW.quantity,
          times_purchased_this_week = times_purchased_this_week + NEW.quantity
        WHERE ip.item_id = NEW.item_id;
      END;
    `;
    
    try {
      await pool.query(triggerSQL);
      console.log('Trigger created successfully');
    } catch (err) {
      // Check for specific error conditions
      if (err.code === 'ER_TRG_ALREADY_EXISTS') {
        console.log('Trigger already exists');
      } else {
        console.error('Error creating trigger:', err);
        console.error('Error details:', {
          code: err.code,
          sqlMessage: err.sqlMessage,
          sql: err.sql
        });
      }
    }
  };

  const initializeDatabaseTriggers = async () => {
    try {
      await createTriggers();
    } catch (error) {
      console.error('Failed to initialize database triggers:', error);
    }
  };