const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const port = 3000;

// Hardcoded data from App.js (will be replaced by DB data later)
const artisansData = [
  { id: 1, name: "Asha Patel", photo: "https://img.freepik.com/premium-photo/image-portrait-smiling-young-female-college-school-pretty-student-girl-solid-background_1021867-35983.jpg", bio: "Traditional block-print artisan from Rajasthan.", craft: "Handmade textile blocks and prints" },
  { id: 2, name: "Raju Singh", photo: "https://tse2.mm.bing.net/th/id/OIP.BaWwoS1-Q01Had91bbauWwHaFj?w=960&h=720&rs=1&pid=ImgDetMain&o=7&rm=3", bio: "Master woodcarver specializing in fine furniture.", craft: "Intricately carved wooden tables and chairs" },
  { id: 3, name: "Mina Devi", photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpXfSnhf_YfKmNbNHubVsYnrvJbMSFg5E89hN0zCfE7EfRSsSgiMWNCaJz1Do_g4L3-Ap3nCtQy_sngHls3W3P1O9skoXWGDfXd7XnT3NIFVa3E1GRg3oODsXM5Aa-_7JXZkR9oIZumlK0xagYwr1sDDM6T4bAk2GCyHD6ajiI9cCFxYSGGp9xste5VzLs/s800/must-visit-shopping-destination-cebu.jpg", bio: "Jewelry artisan from South India with 15 years of experience.", craft: "Handcrafted silver and gemstone jewelry" }
];

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


// API endpoints
app.get('/api/artisans', (req, res) => {
  res.json(artisansData);
});

app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        res.json(rows);
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;

    db.get('SELECT id, name, email, role FROM users WHERE email = ? AND password = ? AND role = ?', [email, password, role], (err, user) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
        } else if (user) {
            // For simplicity, we're just returning user info. In a real app, use JWTs.
            res.status(200).json({ message: 'Login successful!', userId: user.id, userName: user.name, userRole: user.role, token: 'fake-jwt-token' });
        } else {
            res.status(401).json({ message: 'Invalid credentials or role.' });
        }
    });
});

// Signup endpoint
app.post('/api/signup', (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
        res.status(400).json({ message: 'All fields are required.' });
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'Please enter a valid email address.' });
        return;
    }

    // Validate password length
    if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        return;
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }

        if (existingUser) {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return;
        }

        // Create new user
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
            [name, email, password, role], function(err) {
            if (err) {
                res.status(500).json({ message: 'Failed to create account. Please try again.' });
                return;
            }
            
            res.status(201).json({ 
                message: 'Account created successfully!', 
                userId: this.lastID,
                userName: name,
                userRole: role
            });
        });
    });
});

// Add product endpoint
app.post('/api/products', (req, res) => {
    const { name, category, price, img, artisan_id } = req.body;

    // In a real application, you would verify the token and artisan_id here
    // For now, we trust the artisan_id sent from the client-side (add-product.js)

    db.run('INSERT INTO products (name, category, price, img, artisan_id) VALUES (?, ?, ?, ?, ?)', [name, category, price, img, artisan_id], function(err) {
        if (err) {
            res.status(500).json({ message: 'Failed to add product to database.', error: err.message });
            return;
        }
        res.status(201).json({ message: 'Product added successfully!', productId: this.lastID });
    });
});

// Get artisan details endpoint
app.get('/api/artisans/:id', (req, res) => {
    const artisanId = req.params.id;
    
    db.get('SELECT * FROM users WHERE id = ? AND role = "artisan"', [artisanId], (err, artisan) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        if (!artisan) {
            res.status(404).json({ message: 'Artisan not found.' });
            return;
        }
        
        // Get artisan's products
        db.all('SELECT * FROM products WHERE artisan_id = ?', [artisanId], (err, products) => {
            if (err) {
                res.status(500).json({ message: 'Database error.' });
                return;
            }
            
            res.json({ artisan, products });
        });
    });
});

// Add review endpoint
app.post('/api/reviews', (req, res) => {
    const { product_id, user_id, rating, review_text } = req.body;
    
    if (!product_id || !user_id || !rating || rating < 1 || rating > 5) {
        res.status(400).json({ message: 'Invalid review data.' });
        return;
    }
    
    db.run('INSERT OR REPLACE INTO reviews (product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)', 
        [product_id, user_id, rating, review_text], function(err) {
        if (err) {
            res.status(500).json({ message: 'Failed to add review.', error: err.message });
            return;
        }
        
        // Update product average rating
        db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE product_id = ?', 
            [product_id], (err, result) => {
            if (err) {
                console.error('Error updating product rating:', err);
                return;
            }
            
            db.run('UPDATE products SET average_rating = ?, total_reviews = ? WHERE id = ?', 
                [result.avg_rating, result.total_reviews, product_id], (err) => {
                if (err) {
                    console.error('Error updating product rating:', err);
                }
            });
            
            // Update artisan average rating
            db.get('SELECT artisan_id FROM products WHERE id = ?', [product_id], (err, product) => {
                if (err || !product) return;
                
                db.get('SELECT AVG(p.average_rating) as avg_rating, COUNT(p.id) as total_products FROM products p WHERE p.artisan_id = ? AND p.total_reviews > 0', 
                    [product.artisan_id], (err, result) => {
                    if (err) return;
                    
                    db.run('UPDATE users SET average_rating = ?, total_reviews = ? WHERE id = ?', 
                        [result.avg_rating, result.total_products, product.artisan_id], (err) => {
                        if (err) {
                            console.error('Error updating artisan rating:', err);
                        }
                    });
                });
            });
        });
        
        res.status(201).json({ message: 'Review added successfully!', reviewId: this.lastID });
    });
});

// Get reviews for a product
app.get('/api/products/:id/reviews', (req, res) => {
    const productId = req.params.id;
    
    db.all(`SELECT r.*, u.name as user_name FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.product_id = ? 
            ORDER BY r.created_at DESC`, [productId], (err, reviews) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        res.json(reviews);
    });
});

// Get all users (for sellers page)
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, users) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        res.json(users);
    });
});

// Get single user by ID
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        res.json(user);
    });
});

// Get single product details
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        if (!product) {
            res.status(404).json({ message: 'Product not found.' });
            return;
        }
        res.json(product);
    });
});

// Purchase product endpoint
app.post('/api/purchases', (req, res) => {
    const { product_id, user_id, quantity, shipping_address, payment_method } = req.body;
    
    if (!product_id || !user_id || !quantity || !shipping_address || !payment_method) {
        res.status(400).json({ message: 'Missing required purchase information.' });
        return;
    }
    
    // Get product details to calculate total amount
    db.get('SELECT price FROM products WHERE id = ?', [product_id], (err, product) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        
        if (!product) {
            res.status(404).json({ message: 'Product not found.' });
            return;
        }
        
        const totalAmount = product.price * quantity;
        
        // Store purchase in database
        db.run('INSERT INTO purchases (user_id, product_id, quantity, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)', 
            [user_id, product_id, quantity, totalAmount, shipping_address, payment_method], function(err) {
            if (err) {
                res.status(500).json({ message: 'Failed to process purchase.' });
                return;
            }
            
            res.status(201).json({ 
                message: 'Purchase completed successfully!', 
                orderId: this.lastID,
                productId: product_id,
                userId: user_id,
                quantity: quantity,
                totalAmount: totalAmount
            });
        });
    });
});

// Get purchase history for a user
app.get('/api/purchases/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(`SELECT p.*, pr.name as product_name, pr.price as product_price, pr.img as product_image, pr.category as product_category,
                   u.name as artisan_name
            FROM purchases p 
            JOIN products pr ON p.product_id = pr.id 
            JOIN users u ON pr.artisan_id = u.id
            WHERE p.user_id = ? 
            ORDER BY p.created_at DESC`, [userId], (err, purchases) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        res.json(purchases);
    });
});

// Chat API endpoints

// Get or create chat session
app.post('/api/chat/session', (req, res) => {
    const { artisan_id, customer_id } = req.body;
    
    if (!artisan_id || !customer_id) {
        res.status(400).json({ message: 'Missing artisan_id or customer_id.' });
        return;
    }
    
    // Check if session already exists
    db.get('SELECT * FROM chat_sessions WHERE artisan_id = ? AND customer_id = ?', 
        [artisan_id, customer_id], (err, session) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        
        if (session) {
            res.json({ session_id: session.id, created: false });
        } else {
            // Create new session
            db.run('INSERT INTO chat_sessions (artisan_id, customer_id) VALUES (?, ?)', 
                [artisan_id, customer_id], function(err) {
                if (err) {
                    res.status(500).json({ message: 'Failed to create chat session.' });
                    return;
                }
                res.json({ session_id: this.lastID, created: true });
            });
        }
    });
});

// Send message
app.post('/api/chat/message', (req, res) => {
    const { session_id, sender_id, message_text } = req.body;
    
    if (!session_id || !sender_id || !message_text) {
        res.status(400).json({ message: 'Missing required message data.' });
        return;
    }
    
    db.run('INSERT INTO chat_messages (session_id, sender_id, message_text) VALUES (?, ?, ?)', 
        [session_id, sender_id, message_text], function(err) {
        if (err) {
            res.status(500).json({ message: 'Failed to send message.' });
            return;
        }
        
        // Update session timestamp
        db.run('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [session_id]);
        
        res.json({ 
            message_id: this.lastID, 
            message: 'Message sent successfully!' 
        });
    });
});

// Get chat messages
app.get('/api/chat/session/:sessionId/messages', (req, res) => {
    const sessionId = req.params.sessionId;
    
    db.all(`SELECT m.*, u.name as sender_name, u.role as sender_role 
            FROM chat_messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE m.session_id = ? 
            ORDER BY m.created_at ASC`, [sessionId], (err, messages) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        res.json(messages);
    });
});

// Get chat sessions for a user (artisan or customer)
app.get('/api/chat/sessions/:userId', (req, res) => {
    const userId = req.params.userId;
    const userRole = req.query.role; // 'artisan' or 'customer'
    
    let query;
    if (userRole === 'artisan') {
        query = `SELECT cs.*, u.name as customer_name, u.email as customer_email,
                        (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count,
                        (SELECT message_text FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
                 FROM chat_sessions cs 
                 JOIN users u ON cs.customer_id = u.id 
                 WHERE cs.artisan_id = ? 
                 ORDER BY cs.updated_at DESC`;
    } else {
        query = `SELECT cs.*, u.name as artisan_name, u.email as artisan_email,
                        (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count,
                        (SELECT message_text FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
                 FROM chat_sessions cs 
                 JOIN users u ON cs.artisan_id = u.id 
                 WHERE cs.customer_id = ? 
                 ORDER BY cs.updated_at DESC`;
    }
    
    db.all(query, [userId], (err, sessions) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        res.json(sessions);
    });
});

// Get chat session by IDs
app.get('/api/chat/session/:artisanId/:customerId', (req, res) => {
    const artisanId = req.params.artisanId;
    const customerId = req.params.customerId;
    
    db.get('SELECT * FROM chat_sessions WHERE artisan_id = ? AND customer_id = ?', 
        [artisanId, customerId], (err, session) => {
        if (err) {
            res.status(500).json({ message: 'Database error.' });
            return;
        }
        
        if (!session) {
            res.status(404).json({ message: 'Chat session not found.' });
            return;
        }
        
        res.json(session);
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});