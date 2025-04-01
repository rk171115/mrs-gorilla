// migration.js
const UserTable = require('../models/Users/usertable');
const AddressTable = require('../models/Address/addresstable');
const ItemsTable = require('../models/ApiRoutes/apiRoutestable');
const BasketTable = require('../models/Baskets/baskettable');
const BookingOrderTable = require('../models/Cart/carttable');
const BookingDetailsTable = require('../models/Bookings/bookingstable');
const VegetableCartDatabase = require('../models/VegetableCart/vegetablecartdatabase'); // Adjust path as needed
const VendorDetailsTable= require('../models/Vendor/Vendor_details/vendor_detailstable');
const VendorAuthTable= require('../models/Vendor/Vendor_auth/vendor_authtable');
const OrderRequestTable= require('../models/Vendor/Order_request/OrderRequestTable');
const WarehouseTable= require('../models/Vendor/Warehouse/warehousetable');
const ItemPromotionTable= require('../models/Promotion/item_promotiontable');

const BillingTable = require('../models/Vendor/Vendorbilling/BillingTable');







// List of all tables to migrate
const tables = [
  { name: 'Users', tableClass: UserTable },
  { name: 'Addresses', tableClass: AddressTable },
  { name: 'Items', tableClass: ItemsTable },
  { name: 'Baskets', tableClass: BasketTable },
  { name: 'order', tableClass: BookingOrderTable },
  { name: 'Booking Details', tableClass: BookingDetailsTable },
  { name: 'Vendor details', tableClass: VendorDetailsTable },
  { name: 'Vendor auth', tableClass:  VendorAuthTable},
  { name: 'order request', tableClass: OrderRequestTable },
  { name: 'Warehouse ', tableClass:  WarehouseTable},
  { name: 'Promotion ', tableClass:  ItemPromotionTable},
  { name: 'Billing', tableClass: BillingTable },

  
  // Add any new tables here in the future
];


// Run migrations in sequence
async function runMigrations() {
  console.log('Starting database migrations...');
  
  for (const table of tables) {
    try {
      console.log(`Creating ${table.name} table...`);
      await table.tableClass.createTable();
      console.log(`✅ ${table.name} table created successfully`);
    } catch (error) {
      console.error(`❌ Error creating ${table.name} table:`, error);
      process.exit(1);
    }
  }

  try {
    console.log('Adding user_id column to order_request table...');
    await OrderRequestTable.addUserIdColumn();
    console.log('✅ User_id column added to order_request table successfully');
  } catch (error) {
    console.error('❌ Error adding user_id column:', error);
    process.exit(1);
  }

  try {
    console.log('Adding warehouse foreign key to vendor_details table...');
    await VendorDetailsTable.alterTableAddWarehouseFK();
    console.log('✅ Warehouse foreign key added to vendor_details successfully');
  } catch (error) {
    console.error('❌ Error adding warehouse foreign key:', error);
    process.exit(1);
  }

  

  

  try {
    console.log('Initializing VegetableCart tables...');
    const initSuccess = await VegetableCartDatabase.initTables();
    if (initSuccess) {
      console.log('✅ VegetableCart tables created successfully');
      
      // Run the type updates after table creation
      console.log('Updating items table types...');
      const updateSuccess = await VegetableCartDatabase.updateItemsTableTypes();
      if (updateSuccess) {
        console.log('✅ Items table types updated successfully');
      } else {
        console.error('❌ Error updating items table types');
        process.exit(1);
      }
    } else {
      console.error('❌ Error creating VegetableCart tables');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error with VegetableCart database initialization:', error);
    process.exit(1);
  }
  
  console.log('✅ All migrations completed successfully');
  process.exit(0);
}

// Execute migrations when file is run directly
if (require.main === module) {
  runMigrations()
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };