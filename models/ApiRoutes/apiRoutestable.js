const { pool } = require('../../db_conn');


class ItemsTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS items (
        id INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        type ENUM('vegetable', 'fruit', 'ingredient', 'herbs') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        unit ENUM('kg', 'litre', 'piece', 'dozen', 'gram', 'bun') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        old_price_per_unit DECIMAL(10,2) NOT NULL,
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        image_url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        image_url_2 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `;
    await pool.query(query);
    await ItemsTable.insertSeedData(); // ✅ Insert data after table creation
    return true;
  }

  static async insertSeedData() {
    const query = `
      INSERT INTO items (id, name, type, unit, price_per_unit, old_price_per_unit, description, image_url, image_url_2, created_at, updated_at)
      VALUES
      (1, 'Aloo', 'vegetable', 'kg', 30.00, 35.00, 'Make paratha, aloo sabzi, vadapao, dam aloo, aloo matar, aloo pakoda', 'images/image1.jpeg', 'images/aloolarge.png', '2025-03-05 02:28:10', '2025-03-26 07:06:03'),
      (2, 'Pyaaz', 'vegetable', 'kg', 25.00, 27.00, 'Essential for tadka, curries, and many Indian dishes', 'images/onion2.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-26 08:59:21'),
      (3, 'Tamatar', 'vegetable', 'kg', 40.00, 48.00, 'Perfect for curries, sabzi, and gravies', 'images/tamatar3.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
      (4, 'Adrak', 'herbs', 'kg', 80.00, 93.00, 'Use in chai, curries, and for medicinal purposes', 'images/Adrak4.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-26 09:34:37'),
      (5, 'Lasun', 'herbs', 'kg', 60.00, 75.00, 'Add flavor to curries, dals, and chutneys', 'images/lasun5.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-26 09:33:00'),
(6, 'Mirch', 'vegetable', 'kg', 50.00, 55.00, 'Add spice to your dishes, make mirchi pakoda, bharwa mirch', 'images/Mirch6.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(7, 'Lemon', 'vegetable', 'piece', 5.00, 8.00, 'Use in drinks, salads, and as garnish', 'images/Lemon7.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(8, 'Bhindi', 'vegetable', 'kg', 40.00, 43.00, 'Make bharwa bhindi, bhindi masala, and bhindi fry', 'images/Bhindi8.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(9, 'Karela', 'staples', 'kg', 35.00, 41.00, 'Great for karela chips, stuffed karela, and karela sabzi', 'images/karela9.jpeg', 'images/bigkarela.png', '2025-03-05 02:28:10', '2025-03-25 21:50:49'),
(10, 'Shimla Mirch', 'vegetable', 'kg', 45.00, 49.00, 'Excellent for stuffing, stir-fries, and salads', 'images/ShimlaMirch10.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-25 21:43:33'),
(11, 'Lauki', 'vegetable', 'kg', 25.00, 32.00, 'Make lauki kofta, lauki chana dal, and bottle gourd curry', 'images/lauki11.jpeg', 'images/biglauki.png', '2025-03-05 02:28:10', '2025-03-25 21:51:29'),
(12, 'Patta Gobhi', 'vegetable', 'kg', 30.00, 39.00, 'Use in salads, patta gobhi sabzi, and coleslaw', 'images/pattagobhi12.jpeg', 'images/bigpattagobhi.png\r\n', '2025-03-05 02:28:10', '2025-03-25 21:51:59'),
(13, 'Full Gobhi', 'vegetable', 'kg', 35.00, 38.00, 'Make gobi manchurian, gobi paratha, and aloo gobi', 'images/Fullgobhi13.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-25 21:42:54'),
(14, 'Mushroom', 'vegetable', 'kg', 100.00, 110.00, 'Perfect for mushroom curry, mushroom masala, and stir-fries', 'images/Mushroom14.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(15, 'Paneer', 'ingredient', 'kg', 200.00, 230.00, 'Make paneer butter masala, paneer tikka, and palak paneer', 'images/Paneer15.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(16, 'Dhaniya', 'ingredient', 'bun', 10.00, 12.00, 'Perfect for garnishing, chutneys, and salads', 'images/Dhaniya16.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(17, 'Mango', 'fruit', 'kg', 80.00, 85.00, 'Enjoy fresh, in smoothies, or make aam panna', 'images/Mango17.jpeg','images/mangolarge.png' ,'2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(18, 'Banana', 'fruit', 'dozen', 40.00, 45.00, 'Perfect healthy snack, use in smoothies and desserts', 'images/Banana18.jpeg', 'images/bananalarge.png', '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(19, 'Apple', 'fruit', 'kg', 100.00, 148.00, 'Eat fresh, in fruit salads, or make apple pie', 'images/Apple19.jpeg', 'images/applelarge.webp', '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(20, 'Guava', 'fruit', 'kg', 50.00, 62.00, 'Rich in vitamin C, enjoy fresh or in smoothies', 'images/Guava20.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(21, 'Orange', 'fruit', 'kg', 60.00, 69.00, 'Refreshing citrus fruit, great for juices and salads', 'images/Orange21.jpeg', 'images/orangelarge.png', '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(22, 'Pomegranate', 'fruit', 'piece', 50.00, 55.00, 'Eat fresh, use in fruit salads, or make juice', 'images/Pomegranate22.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(23, 'Papaya', 'fruit', 'kg', 40.00, 44.00, 'Great for breakfast, smoothies, and fruit salads', 'images/Papaya23.jpeg', 'images/papayalarge.png', '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(24, 'Grapes', 'fruit', 'kg', 80.00, 88.00, 'Enjoy fresh, in desserts, or make juice', 'images/Grapes24.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(25, 'Watermelon', 'fruit', 'piece', 100.00, 110.00, 'Perfect for summer refreshment, picnics, and fruit salads', 'images/watermelon25.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(26, 'Pineapple', 'fruit', 'piece', 80.00, 88.00, 'Enjoy fresh, in fruit salads, or tropical drinks', 'images/Pineapple26.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(27, 'Strawberry', 'fruit', 'kg', 200.00, 220.00, 'Delicious in desserts, milkshakes, and fresh', 'images/Strawberry27.jpeg', NULL, '2025-03-05 02:28:10', '2025-03-10 01:17:31'),
(28, 'Carrot', 'vegetable', 'kg', 30.00, 33.00, 'Use in gajar halwa, salads, and soups', 'images/Carrot28.jpeg', 'images/bigcarrot.png', '2025-03-05 11:23:47', '2025-03-25 21:54:03'),
(29, 'peas', 'vegetable', 'kg', 20.00, 22.00, 'Make matar paneer, aloo matar, and pulao', 'images/peas29.jpeg', 'images/peaslarge.png', '2025-03-05 11:25:25', '2025-03-10 01:17:31'),
(30, 'brocolli', 'vegetable', 'kg', 50.00, 55.00, 'Great for stir-fries, soups, and pasta dishes', 'images/brocolli30.jpeg', 'images/bigbroccoli.png', '2025-03-05 11:29:15', '2025-03-25 21:54:35'),
(32, 'baingan ', 'vegetable', 'kg', 36.00, 44.00, 'Perfect for baingan bharta, bharwa baingan, and baingan fry', 'images/baingan32.jpeg', NULL, '2025-03-05 11:39:01', '2025-03-10 01:17:31')

      
       ON DUPLICATE KEY UPDATE name = VALUES(name); -- ✅ Prevent duplicate insertions
    `;
    await pool.query(query);
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS items';
    await pool.query(query);
    return true;
  }
}

module.exports = ItemsTable;
