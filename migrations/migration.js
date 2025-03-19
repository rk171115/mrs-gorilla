// migration.js
const AddressTable = require('../models/Address/addresstable');
const ItemsTable = require('../models/ApiRoutes/apiRoutestable');
const BasketTable = require('../models/Baskets/baskettable');
const BookingDetailsTable = require('../models/Bookings/bookingstable');
const DishIngredientsTable= require('../models/DishIngredients/dishIngredientstable');
const DishNutritionTable= require('../models/DishNutrition/dishNutritiontable');
const VegetableCartDatabase = require('../models/VegetableCart/vegetablecartdatabase'); // Adjust path as needed




// List of all tables to migrate
const tables = [
  { name: 'Addresses', tableClass: AddressTable },
  { name: 'Items', tableClass: ItemsTable },
  { name: 'Baskets', tableClass: BasketTable },
  { name: 'Booking Details', tableClass: BookingDetailsTable },
  { name: 'Dish Ingredients', tableClass: DishIngredientsTable },
  { name: 'Dish Nutrition', tableClass: DishNutritionTable },
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