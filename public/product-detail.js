document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        document.getElementById('product-details').innerHTML = '<p>Product ID not provided.</p>';
        return;
    }
    
    loadProductDetails(productId);
    loadProductReviews(productId);
    
    // Purchase form submission
    document.getElementById('purchaseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('purchaseProductId').value;
        const quantity = document.getElementById('quantity').value;
        const shippingAddress = document.getElementById('shippingAddress').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            showPurchaseMessage('Please login to purchase products.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/purchases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    user_id: userId,
                    quantity: parseInt(quantity),
                    shipping_address: shippingAddress,
                    payment_method: paymentMethod
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store purchase in localStorage
                const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
                purchases.push({
                    product_id: productId,
                    user_id: userId,
                    quantity: parseInt(quantity),
                    order_id: data.orderId,
                    date: new Date().toISOString()
                });
                localStorage.setItem('purchases', JSON.stringify(purchases));
                
                showPurchaseMessage('Purchase completed successfully!', 'success');
                setTimeout(() => {
                    closePurchaseModal();
                    // Open rating modal after successful purchase
                    openRatingModal(productId);
                }, 1500);
            } else {
                showPurchaseMessage('Failed to complete purchase: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error completing purchase:', error);
            showPurchaseMessage('An error occurred while processing your purchase.', 'error');
        }
    });
    
    // Rating form submission
    document.getElementById('ratingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('ratingProductId').value;
        const rating = document.getElementById('rating').value;
        const reviewText = document.getElementById('reviewText').value;
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            showRatingMessage('Please login to rate products.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    user_id: userId,
                    rating: parseInt(rating),
                    review_text: reviewText
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showRatingMessage('Review submitted successfully!', 'success');
                setTimeout(() => {
                    closeRatingModal();
                    loadProductDetails(productId); // Reload to show updated ratings
                    loadProductReviews(productId); // Reload reviews
                }, 1500);
            } else {
                showRatingMessage('Failed to submit review: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showRatingMessage('An error occurred while submitting your review.', 'error');
        }
    });
    
    // Update total price when quantity changes
    document.getElementById('quantity').addEventListener('input', updateTotalPrice);
});

async function loadProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();
        
        if (response.ok) {
            // Fetch artisan details
            const artisanResponse = await fetch(`/api/artisans/${product.artisan_id}`);
            const artisanData = await artisanResponse.json();
            
            if (artisanResponse.ok) {
                displayProductDetails(product, artisanData.artisan);
            } else {
                displayProductDetails(product, null);
            }
        } else {
            document.getElementById('product-details').innerHTML = '<p>Product not found.</p>';
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        document.getElementById('product-details').innerHTML = '<p>Error loading product details.</p>';
    }
}

async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/products/${productId}/reviews`);
        const reviews = await response.json();
        
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviews-list').innerHTML = '<p>Error loading reviews.</p>';
    }
}

function displayProductDetails(product, artisan) {
    const productDetails = document.getElementById('product-details');
    
    const ratingStars = generateStars(product.average_rating || 0);
    const ratingText = product.average_rating ? 
        `${product.average_rating.toFixed(1)} (${product.total_reviews || 0} reviews)` : 
        'No reviews yet';
    
    // Check if user has purchased this product
    const userId = localStorage.getItem('userId');
    const hasPurchased = checkPurchaseStatus(product.id, userId);
    
    const artisanInfo = artisan ? `
        <div class="artisan-info-section">
            <h3>Artisan Information</h3>
            <div class="artisan-link">
                <img src="${getArtisanPhoto(artisan.id)}" alt="${artisan.name}" class="artisan-thumbnail">
                <div class="artisan-details">
                    <p><strong>Artisan:</strong> <a href="artisan-detail.html?id=${artisan.id}" class="artisan-link-text">${artisan.name}</a></p>
                    <p><strong>Specialty:</strong> ${getArtisanCraft(artisan.id)}</p>
                    <p><strong>Rating:</strong> ${generateStars(artisan.average_rating || 0)} ${artisan.average_rating ? artisan.average_rating.toFixed(1) : 'No ratings'}</p>
                </div>
            </div>
        </div>
    ` : `
        <div class="artisan-info-section">
            <h3>Artisan Information</h3>
            <p><strong>Artisan ID:</strong> ${product.artisan_id}</p>
        </div>
    `;
    
    productDetails.innerHTML = `
        <div class="product-header">
            <div class="product-image">
                <img src="${product.img || 'https://via.placeholder.com/400x400'}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h1>${product.name}</h1>
                <div class="product-price">$${product.price}</div>
                <div class="product-rating">
                    <div class="stars">${ratingStars}</div>
                    <div class="rating-text">${ratingText}</div>
                </div>
                <div class="product-details">
                    <h3>Product Details</h3>
                    <p><strong>Category:</strong> ${product.category.replace('_', ' ')}</p>
                    <p><strong>Product ID:</strong> ${product.id}</p>
                </div>
                ${artisanInfo}
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="openPurchaseModal(${product.id}, ${product.price})">
                        Buy Now
                    </button>
                    ${hasPurchased ? `
                        <button class="btn btn-secondary" onclick="openReviewModal(${product.id})">
                            Rate & Review
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-user">${review.user_name}</div>
                <div class="review-rating">${generateStars(review.rating)}</div>
            </div>
            <div class="review-text">${review.review_text || 'No review text provided.'}</div>
            <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
        </div>
    `).join('');
}

function openPurchaseModal(productId, price) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please login to purchase products.');
        return;
    }
    
    document.getElementById('purchaseProductId').value = productId;
    document.getElementById('purchaseProductPrice').value = price;
    document.getElementById('purchaseModal').style.display = 'block';
    updateTotalPrice();
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
    document.getElementById('purchaseForm').reset();
    document.getElementById('purchaseMessage').textContent = '';
    document.getElementById('purchaseMessage').className = 'message';
}

function updateTotalPrice() {
    const quantity = document.getElementById('quantity').value || 1;
    const price = document.getElementById('purchaseProductPrice').value || 0;
    const total = quantity * price;
    document.getElementById('totalPrice').textContent = `Total: $${total.toFixed(2)}`;
}

function showPurchaseMessage(message, type) {
    const messageElement = document.getElementById('purchaseMessage');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
}

function checkPurchaseStatus(productId, userId) {
    // In a real application, this would check the database
    // For now, we'll use localStorage to simulate purchase history
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    return purchases.some(purchase => purchase.product_id == productId && purchase.user_id == userId);
}

function openRatingModal(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please login to rate products.');
        return;
    }
    
    document.getElementById('ratingProductId').value = productId;
    document.getElementById('ratingModal').style.display = 'block';
}

function closeRatingModal() {
    document.getElementById('ratingModal').style.display = 'none';
    document.getElementById('ratingForm').reset();
    document.getElementById('ratingMessage').textContent = '';
    document.getElementById('ratingMessage').className = 'message';
}

function showRatingMessage(message, type) {
    const messageElement = document.getElementById('ratingMessage');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
}

function openReviewModal(productId) {
    openRatingModal(productId);
}

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
    const photos = {
        2: "https://img.freepik.com/premium-photo/image-portrait-smiling-young-female-college-school-pretty-student-girl-solid-background_1021867-35983.jpg",
        3: "https://tse2.mm.bing.net/th/id/OIP.BaWwoS1-Q01Had91bbauWwHaFj?w=960&h=720&rs=1&pid=ImgDetMain&o=7&rm=3",
        4: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpXfSnhf_YfKmNbNHubVsYnrvJbMSFg5E89hN0zCfE7EfRSsSgiMWNCaJz1Do_g4L3-Ap3nCtQy_sngHls3W3P1O9skoXWGDfXd7XnT3NIFVa3E1GRg3oODsXM5Aa-_7JXZkR9oIZumlK0xagYwr1sDDM6T4bAk2GCyHD6ajiI9cCFxYSGGp9xste5VzLs/s800/must-visit-shopping-destination-cebu.jpg"
    };
    return photos[artisanId] || "https://via.placeholder.com/200";
}

function getArtisanCraft(artisanId) {
    const crafts = {
        2: "Handmade textile blocks and prints",
        3: "Intricately carved wooden tables and chairs",
        4: "Handcrafted silver and gemstone jewelry"
    };
    return crafts[artisanId] || "Handcrafted products";
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const purchaseModal = document.getElementById('purchaseModal');
    const ratingModal = document.getElementById('ratingModal');
    
    if (event.target === purchaseModal) {
        closePurchaseModal();
    }
    if (event.target === ratingModal) {
        closeRatingModal();
    }
}
