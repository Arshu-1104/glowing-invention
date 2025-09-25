
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    const menuBarContainer = document.getElementById('menuBarContainer');

    let searchTerm = "";
    let selectedCategories = ["textiles", "woodwork", "jewelry", "raw_material"];
    let lastClickedCategory = null;
    let selectedArtisan = null;

    // Initialize professional menu bar
    const initializeMenuBar = () => {
        const menuBar = new MenuBar();
        menuBarContainer.appendChild(menuBar.render());
    };

    // Initialize menu bar
    initializeMenuBar();


    const renderArtisans = (artisans) => {
        const artisansContainer = document.createElement('div');
        artisansContainer.innerHTML = `
            <h1>Meet Our Artisans</h1>
            <div class="artisans-grid">
                ${artisans.map(artisan => `
                    <div class="artisan-card">
                        <img src=${artisan.photo} alt=${artisan.name} />
                        <h3>${artisan.name}</h3>
                        <p>${artisan.bio}</p>
                        <p>${artisan.craft}</p>
                        <div class="artisan-rating">
                            <span class="stars">${generateStars(artisan.average_rating || 0)}</span>
                            <span class="rating-text">${artisan.average_rating ? artisan.average_rating.toFixed(1) : 'No ratings'}</span>
                        </div>
                        <div class="artisan-actions">
                            <button class="chat-artisan-btn" onclick="startChat(${artisan.id}, '${artisan.name}', '${artisan.email}')">
                                Chat with Artisan
                            </button>
                            <button class="view-details-btn" onclick="window.location.href='artisan-detail.html?id=${artisan.id}'">
                                View Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        return artisansContainer;
    };

    const renderProducts = (products) => {
        const productsContainer = document.createElement('div');

        const filteredProducts = products.filter(
            p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && selectedCategories.includes(p.category)
        );

        productsContainer.innerHTML = `
            <h1>Artisan Product Catalog</h1>
            <input
              type="text"
              placeholder="Search products..."
              value="${searchTerm}"
              class="product-search-input"
            />
            <div class="category-filters">
                ${["textiles","woodwork","jewelry", "raw_material"].map(cat => `
                    <label>
                        <input
                            type="checkbox"
                            ${selectedCategories.includes(cat) ? 'checked' : ''}
                            onchange="handleCategoryChange('${cat}')"
                        />
                        ${cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                    </label>
                `).join('')}
            </div>
            <div class="products-grid">
                ${filteredProducts.length ? filteredProducts.map(product => `
                    <div class="product-card" data-category="${product.category}" onclick="window.location.href='product-detail.html?id=${product.id}'">
                        <img src="https://via.placeholder.com/150" alt="${product.name}" data-product-id="${product.id}" class="product-image" />
                        <h3>${product.name}</h3>
                        <p>$${product.price}</p>
                        <div class="product-rating">
                            <span class="stars">${generateStars(product.average_rating || 0)}</span>
                            <span class="rating-count">(${product.total_reviews || 0} reviews)</span>
                        </div>
                    </div>
                `).join('') : `<p class="no-products-message">No products found.</p>`}
            </div>
        `;

        const searchInput = productsContainer.querySelector('.product-search-input');
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            rerender(artisans, products);
        });

        productsContainer.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                lastClickedCategory = e.currentTarget.dataset.category;
                rerender(artisans, products);
            });
        });

        // Load product images after rendering
        setTimeout(() => {
            loadProductImages();
        }, 100);

        return productsContainer;
    };

    const renderRecommendations = (products) => {
        const recommendationsContainer = document.createElement('div');
        const recommendedProducts = lastClickedCategory
            ? products.filter(p => p.category === lastClickedCategory)
            : [];

        recommendationsContainer.innerHTML = `
            <h2>Recommended For You</h2>
            <div class="products-grid">
                ${recommendedProducts.length ? recommendedProducts.map(product => `
                    <div class="product-card">
                        <img src="https://via.placeholder.com/150" alt="${product.name}" data-product-id="${product.id}" class="product-image" />
                        <h3>${product.name}</h3>
                        <p>$${product.price}</p>
                    </div>
                `).join('') : `<p class="no-products-message">Click on a product to see recommendations.</p>`}
            </div>
        `;
        
        // Load product images for recommendations
        setTimeout(() => {
            loadProductImages();
        }, 100);
        
        return recommendationsContainer;
    };

    const renderContactForm = () => {
        const contactFormContainer = document.createElement('div');
        contactFormContainer.className = 'contact-form-container';
        
        const artisanInfo = selectedArtisan ? 
            `<div class="selected-artisan-info">
                <h3>Contacting: ${selectedArtisan.name}</h3>
                <p>Email: ${selectedArtisan.email}</p>
            </div>` : 
            '<p class="select-artisan-message">Select an artisan above to contact them</p>';
        
        contactFormContainer.innerHTML = `
            <h1>Contact Artisan</h1>
            ${artisanInfo}
            <form id="contactForm" novalidate ${selectedArtisan ? '' : 'style="display: none;"'}>
                <label for="name">Your Name</label>
                <input type="text" id="name" name="name" required>
                <div id="nameError" class="error-message"></div>

                <label for="email">Your Email</label>
                <input type="email" id="email" name="email" required>
                <div id="emailError" class="error-message"></div>

                <label for="message">Message / Inquiry</label>
                <textarea id="message" name="message" rows="4" required></textarea>
                <div id="messageError" class="error-message"></div>

                <button type="submit" class="submit-button">
                    Send Inquiry to ${selectedArtisan ? selectedArtisan.name : 'Artisan'}
                </button>
                <div id="successMsg" class="success-message"></div>
            </form>
        `;

        const contactForm = contactFormContainer.querySelector('#contactForm');
        const nameInput = contactForm.querySelector('#name');
        const emailInput = contactForm.querySelector('#email');
        const messageInput = contactForm.querySelector('#message');
        const nameError = contactForm.querySelector('#nameError');
        const emailError = contactForm.querySelector('#emailError');
        const messageError = contactForm.querySelector('#messageError');
        const successMsg = contactForm.querySelector('#successMsg');

        const validateEmail = email => /^[^S@]+@[^S@]+\.[^S@]+$/.test(email);

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let errors = {};
            nameError.textContent = '';
            emailError.textContent = '';
            messageError.textContent = '';
            successMsg.textContent = '';

            if (!nameInput.value.trim()) errors.name = "Please enter your name.";
            if (!emailInput.value.trim()) errors.email = "Please enter your email.";
            else if (!validateEmail(emailInput.value)) errors.email = "Please enter a valid email.";
            if (!messageInput.value.trim()) errors.message = "Please enter a message.";

            if (Object.keys(errors).length) {
                if (errors.name) nameError.textContent = errors.name;
                if (errors.email) emailError.textContent = errors.email;
                if (errors.message) messageError.textContent = errors.message;
            } else {
                successMsg.textContent = "Thank you! Your inquiry has been sent.";
                contactForm.reset();
            }
        });
        return contactFormContainer;
    };

    window.handleCategoryChange = (category) => {
        if (selectedCategories.includes(category)) {
            selectedCategories = selectedCategories.filter(c => c !== category);
        } else {
            selectedCategories.push(category);
        }
        rerender(allArtisans, allProducts);
    };

    const rerender = (artisans, products) => {
        root.innerHTML = '';
        root.appendChild(renderArtisans(artisans));
        root.appendChild(renderProducts(products));
        root.appendChild(renderRecommendations(products));
    };

    let allArtisans, allProducts;

    Promise.all([
        fetch('/api/users').then(res => res.json()).then(users => users.filter(user => user.role === 'artisan')),
        fetch('/api/products').then(res => res.json())
    ]).then(([artisansData, productsData]) => {
        // Add photo and bio data to artisans from database
        const artisansWithPhotos = artisansData.map(artisan => ({
            ...artisan,
            photo: getArtisanPhoto(artisan.id),
            bio: getArtisanBio(artisan.id),
            craft: getArtisanCraft(artisan.id)
        }));
        
        allArtisans = artisansWithPhotos;
        allProducts = productsData;
        rerender(allArtisans, allProducts);
    }).catch(error => {
        console.error('Error fetching initial data:', error);
        root.innerHTML = '<p class="no-products-message">Failed to load marketplace data. Please try again later.</p>';
    });
});

// Helper function to generate star ratings
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
}

// Helper functions to get artisan data
function getArtisanPhoto(artisanId) {
    return `sellerimages/${artisanId}.jpg`;
}

// Function to get primary image for a product
async function getProductPrimaryImage(productId) {
    try {
        console.log(`Fetching images for product ${productId}`);
        const response = await fetch(`/api/products/${productId}/images`);
        if (response.ok) {
            const images = await response.json();
            console.log(`Images for product ${productId}:`, images);
            const primaryImage = images.find(img => img.is_primary) || images[0];
            const imagePath = primaryImage ? primaryImage.image_path : 'https://via.placeholder.com/150';
            console.log(`Selected image path: ${imagePath}`);
            return imagePath;
        } else {
            console.error(`Failed to fetch images for product ${productId}:`, response.status);
        }
    } catch (error) {
        console.error('Error fetching product image:', error);
    }
    return 'https://via.placeholder.com/150';
}

// Function to load product images for all products on the page
async function loadProductImages() {
    const productImages = document.querySelectorAll('.product-image[data-product-id]');
    console.log(`Found ${productImages.length} product images to load`);
    
    for (const img of productImages) {
        const productId = img.getAttribute('data-product-id');
        console.log(`Loading image for product ${productId}`);
        const imagePath = await getProductPrimaryImage(productId);
        console.log(`Setting image src to: ${imagePath}`);
        img.src = imagePath;
    }
}

function getArtisanBio(artisanId) {
    const bios = {
        2: "Traditional block-print artisan from Rajasthan.",
        3: "Master woodcarver specializing in fine furniture.",
        4: "Jewelry artisan from South India with 15 years of experience."
    };
    return bios[artisanId] || "Skilled artisan with years of experience.";
}

function getArtisanCraft(artisanId) {
    const crafts = {
        2: "Handmade textile blocks and prints",
        3: "Intricately carved wooden tables and chairs",
        4: "Handcrafted silver and gemstone jewelry"
    };
    return crafts[artisanId] || "Handcrafted products";
}

// User menu functions
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

function viewProfile() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    const content = document.getElementById('userInfoContent');
    content.innerHTML = `
        <div class="user-info-item">
            <h3>Personal Information</h3>
            <p><strong>Name:</strong> ${userName || 'Not set'}</p>
            <p><strong>Role:</strong> ${userRole || 'Not set'}</p>
            <p><strong>User ID:</strong> ${userId || 'Not set'}</p>
        </div>
        <div class="user-info-item">
            <h3>Account Status</h3>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Member Since:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    
    document.getElementById('userInfoModal').style.display = 'block';
    toggleUserMenu();
}

async function viewShoppingHistory() {
    const userId = localStorage.getItem('userId');
    const content = document.getElementById('shoppingHistoryContent');
    
    if (!userId) {
        content.innerHTML = '<div class="no-data">Please log in to view your purchase history.</div>';
        document.getElementById('shoppingHistoryModal').style.display = 'block';
        toggleUserMenu();
        return;
    }
    
    try {
        const response = await fetch(`/api/purchases/${userId}`);
        const purchases = await response.json();
        
        if (response.ok) {
            if (purchases.length === 0) {
                content.innerHTML = '<div class="no-data">No purchase history found.</div>';
            } else {
                content.innerHTML = purchases.map((purchase, index) => `
                    <div class="shopping-history-item">
                        <div class="purchase-header">
                            <h3>Order #${purchase.id}</h3>
                            <span class="purchase-date">${new Date(purchase.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div class="product-info">
                            <div class="product-image">
                                <a href="product-detail.html?id=${purchase.product_id}">
                                    <img src="${purchase.product_image || 'https://via.placeholder.com/100'}" alt="${purchase.product_name}" />
                                </a>
                            </div>
                            <div class="product-details">
                                <h4><a href="product-detail.html?id=${purchase.product_id}">${purchase.product_name}</a></h4>
                                <p class="product-category">${purchase.product_category.charAt(0).toUpperCase() + purchase.product_category.slice(1).replace('_', ' ')}</p>
                                <p class="artisan-name">by ${purchase.artisan_name}</p>
                                <p class="product-price">${purchase.product_price} each</p>
                            </div>
                        </div>
                        
                        <div class="purchase-details">
                            <div class="detail-row">
                                <span class="label">Quantity:</span>
                                <span class="value">${purchase.quantity}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Total Amount:</span>
                                <span class="value total-amount">${purchase.total_amount.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Payment Method:</span>
                                <span class="value">${purchase.payment_method}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Shipping Address:</span>
                                <span class="value">${purchase.shipping_address}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Status:</span>
                                <span class="value status">${purchase.status}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            content.innerHTML = '<div class="no-data">Error loading purchase history. Please try again.</div>';
        }
    } catch (error) {
        console.error('Error loading purchase history:', error);
        content.innerHTML = '<div class="no-data">Error loading purchase history. Please try again.</div>';
    }
    
    document.getElementById('shoppingHistoryModal').style.display = 'block';
    toggleUserMenu();
}

function editProfile() {
    const userName = localStorage.getItem('userName');
    
    const newName = prompt('Enter new name:', userName || '');
    if (newName && newName.trim()) {
        localStorage.setItem('userName', newName.trim());
        alert('Profile updated successfully!');
        location.reload(); // Reload to show updated name
    }
    toggleUserMenu();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        localStorage.removeItem('purchases'); // Clear purchase history on logout
        alert('Logged out successfully!');
        location.reload();
    }
}

// Modal functions
function closeUserInfoModal() {
    document.getElementById('userInfoModal').style.display = 'none';
}

function closeShoppingHistoryModal() {
    document.getElementById('shoppingHistoryModal').style.display = 'none';
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('userMenu');
    const button = document.querySelector('.user-menu-button');
    
    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.style.display = 'none';
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    const userInfoModal = document.getElementById('userInfoModal');
    const shoppingHistoryModal = document.getElementById('shoppingHistoryModal');
    
    if (event.target === userInfoModal) {
        closeUserInfoModal();
    }
    if (event.target === shoppingHistoryModal) {
        closeShoppingHistoryModal();
    }
}

// Start chat function
function startChat(artisanId, artisanName, artisanEmail) {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId) {
        alert('Please login to start a chat.');
        return;
    }
    
    // Prevent self-chat
    if (parseInt(artisanId) === parseInt(userId)) {
        alert('You cannot chat with yourself.');
        return;
    }
    
    // Store chat session data
    const chatSession = {
        artisanId: artisanId,
        artisanName: artisanName,
        artisanEmail: artisanEmail,
        customerId: userId,
        customerName: userName,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('currentChat', JSON.stringify(chatSession));
    
    // Open chat window
    window.open('chat.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
}
