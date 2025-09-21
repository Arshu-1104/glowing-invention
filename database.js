const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('data.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the data.db database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        average_rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        image_path TEXT DEFAULT NULL
    )`, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
        } else {
            // Check if table is empty and insert initial data if it is
            db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
                if (err) {
                    console.error("Error checking users table count:", err.message);
                } else if (row.count === 0) {
                    const stmt = db.prepare('INSERT INTO users (name, email, password, role, image_path) VALUES (?, ?, ?, ?, ?)');
                    stmt.run('Alice', 'alice@example.com', 'password123', 'user', 'sellerimages/1.jpg');
                    stmt.run('Asha Patel', 'asha@example.com', 'artisanpass', 'artisan', 'sellerimages/2.jpg');
                    stmt.run('Raju Singh', 'raju@example.com', 'artisanpass', 'artisan', 'sellerimages/3.jpg');
                    stmt.run('RawMat Seller', 'seller@example.com', 'sellerpass', 'seller', 'sellerimages/5.jpg');
                    stmt.finalize();
                    console.log('Initial user data inserted.');
                }
            });
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        artisan_id INTEGER,
        average_rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        FOREIGN KEY (artisan_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating products table:", err.message);
        } else {
            // Check if table is empty and insert initial data if it is
            db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
                if (err) {
                    console.error("Error checking products table count:", err.message);
                } else if (row.count === 0) {
                    const stmt = db.prepare('INSERT INTO products (name, category, price, artisan_id) VALUES (?, ?, ?, ?)');
                    stmt.run('Block Printed Fabric', 'textiles', 30, 2);
                    stmt.run('Carved Wooden Table', 'woodwork', 150, 3);
                    stmt.run('Silver Gemstone Necklace', 'jewelry', 80, 4);
                    stmt.run('Handwoven Textile Scarf', 'textiles', 25, 2);
                    stmt.run('Premium Cotton Yarn', 'raw_material', 15, 5);
                    stmt.run('Hardwood Blocks', 'raw_material', 45, 5);
                    stmt.finalize();
                    
                    // Insert multiple images for products
                    const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, ?)');
                    // Product 1 - Block Printed Fabric
                    imgStmt.run(1, 'productimages/1_1.jpg', 1);
                    imgStmt.run(1, 'productimages/1_2.jpg', 0);
                    imgStmt.run(1, 'productimages/1_3.jpg', 0);
                    // Product 2 - Carved Wooden Table
                    imgStmt.run(2, 'productimages/2_1.jpg', 1);
                    imgStmt.run(2, 'productimages/2_2.jpg', 0);
                    imgStmt.run(2, 'productimages/2_3.jpg', 0);
                    // Product 3 - Silver Gemstone Necklace
                    imgStmt.run(3, 'productimages/3_1.jpg', 1);
                    imgStmt.run(3, 'productimages/3_2.jpg', 0);
                    // Product 4 - Handwoven Textile Scarf
                    imgStmt.run(4, 'productimages/4_1.jpg', 1);
                    imgStmt.run(4, 'productimages/4_2.jpg', 0);
                    // Product 5 - Premium Cotton Yarn
                    imgStmt.run(5, 'productimages/5_1.jpg', 1);
                    imgStmt.run(5, 'productimages/5_2.jpg', 0);
                    // Product 6 - Hardwood Blocks
                    imgStmt.run(6, 'productimages/6_1.jpg', 1);
                    imgStmt.run(6, 'productimages/6_2.jpg', 0);
                    imgStmt.finalize();
                    console.log('Initial product data inserted.');
                }
            });
        }
    });

    // Create product_images table for multiple images per product
    db.run(`CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error("Error creating product_images table:", err.message);
        }
    });

    // Create reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(product_id, user_id)
    )`, (err) => {
        if (err) {
            console.error("Error creating reviews table:", err.message);
        } else {
            console.log('Reviews table created successfully.');
        }
    });

    // Create chat_sessions table
    db.run(`CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artisan_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (artisan_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES users(id),
        UNIQUE(artisan_id, customer_id)
    )`, (err) => {
        if (err) {
            console.error("Error creating chat_sessions table:", err.message);
        } else {
            console.log('Chat sessions table created successfully.');
        }
    });

    // Create chat_messages table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating chat_messages table:", err.message);
        } else {
            console.log('Chat messages table created successfully.');
        }
    });

    // Create purchases table
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating purchases table:", err.message);
        } else {
            console.log('Purchases table created successfully.');
        }
    });

    // Add rating columns to existing tables if they don't exist
    db.run(`ALTER TABLE products ADD COLUMN average_rating REAL DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding average_rating to products:", err.message);
        }
    });
    
    db.run(`ALTER TABLE products ADD COLUMN total_reviews INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding total_reviews to products:", err.message);
        }
    });
    
    db.run(`ALTER TABLE users ADD COLUMN average_rating REAL DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding average_rating to users:", err.message);
        }
    });
    
    db.run(`ALTER TABLE users ADD COLUMN total_reviews INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding total_reviews to users:", err.message);
        }
    });
});

module.exports = db;