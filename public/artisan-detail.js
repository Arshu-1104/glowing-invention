document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    const urlParams = new URLSearchParams(window.location.search);
    const artisanId = urlParams.get('id');
    
    if (!artisanId) {
        document.getElementById('artisan-details').innerHTML = '<p>Artisan ID not provided.</p>';
        return;
    }
    
    loadArtisanDetails(artisanId);
    
    // Review form submission
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('reviewProductId').value;
        const rating = document.getElementById('reviewRating').value;
        const reviewText = document.getElementById('reviewText').value;
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            alert('Please login to write a review.');
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
                alert('Review submitted successfully!');
                closeReviewModal();
                loadArtisanDetails(artisanId); // Reload to show updated ratings
            } else {
                alert('Failed to submit review: ' + data.message);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('An error occurred while submitting the review.');
        }
    });
});

async function loadArtisanDetails(artisanId) {
    try {
        const response = await fetch(`/api/artisans/${artisanId}`);
        const data = await response.json();
        
        if (response.ok) {
            displayArtisanDetails(data.artisan);
            displayArtisanProducts(data.products);
        } else {
            document.getElementById('artisan-details').innerHTML = '<p>Artisan not found.</p>';
        }
    } catch (error) {
        console.error('Error loading artisan details:', error);
        document.getElementById('artisan-details').innerHTML = '<p>Error loading artisan details.</p>';
    }
}

function displayArtisanDetails(artisan) {
    const artisanDetails = document.getElementById('artisan-details');
    
    const ratingStars = generateStars(artisan.average_rating || 0);
    const ratingText = artisan.average_rating ? 
        `${artisan.average_rating.toFixed(1)} (${artisan.total_reviews || 0} reviews)` : 
        'No reviews yet';
    
    artisanDetails.innerHTML = `
        <div class="artisan-header">
            <img src="${getArtisanPhoto(artisan.id)}" 
                 alt="${artisan.name}" class="artisan-photo">
            <div class="artisan-info">
                <h1>${artisan.name}</h1>
                <p><strong>Email:</strong> ${artisan.email}</p>
                <p><strong>Role:</strong> ${artisan.role}</p>
                <p><strong>Bio:</strong> ${getArtisanBio(artisan.id)}</p>
                <p><strong>Specialty:</strong> ${getArtisanCraft(artisan.id)}</p>
                <div class="rating-display">
                    <div class="stars">${ratingStars}</div>
                    <div class="rating-text">${ratingText}</div>
                </div>
            </div>
        </div>
    `;
}

function displayArtisanProducts(products) {
    const productsContainer = document.getElementById('artisan-products');
    const userId = localStorage.getItem('userId');
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p>No products found for this artisan.</p>';
        return;
    }
    
    productsContainer.innerHTML = products.map(product => {
        const ratingStars = generateStars(product.average_rating || 0);
        const ratingCount = product.total_reviews || 0;
        const hasPurchased = checkPurchaseStatus(product.id, userId);
        
        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">
                <img src="productimages/${product.id}_1.jpg" alt="${product.name}">
                <h3>${product.name}</h3>
                <div class="price">$${product.price}</div>
                <div class="product-rating">
                    <div class="stars">${ratingStars}</div>
                    <div class="rating-count">(${ratingCount} reviews)</div>
                </div>
                ${hasPurchased ? `
                    <button class="review-button" onclick="event.stopPropagation(); openReviewModal(${product.id})">
                        Write Review
                    </button>
                ` : `
                    <button class="review-button" disabled style="background: #666; color: #999; cursor: not-allowed;" onclick="event.stopPropagation();">
                        Purchase to Review
                    </button>
                `}
            </div>
        `;
    }).join('');
}

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

function checkPurchaseStatus(productId, userId) {
    // Check if user has purchased this product
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    return purchases.some(purchase => purchase.product_id == productId && purchase.user_id == userId);
}

function openReviewModal(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please login to write a review.');
        return;
    }
    
    // Check if user has purchased this product
    if (!checkPurchaseStatus(productId, userId)) {
        alert('You can only review products you have purchased.');
        return;
    }
    
    document.getElementById('reviewProductId').value = productId;
    document.getElementById('reviewModal').style.display = 'block';
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('reviewForm').reset();
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('reviewModal');
    if (event.target === modal) {
        closeReviewModal();
    }
}
