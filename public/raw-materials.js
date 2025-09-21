document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    loadRawMaterials();
    loadSellers();
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', searchMaterials);
    document.getElementById('categoryFilter').addEventListener('change', searchMaterials);
    document.getElementById('priceFilter').addEventListener('change', searchMaterials);
});

async function loadRawMaterials() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        // Filter for raw materials
        const rawMaterials = products.filter(product => product.category === 'raw_material');
        displayMaterials(rawMaterials);
    } catch (error) {
        console.error('Error loading raw materials:', error);
        document.getElementById('materialsGrid').innerHTML = '<p class="no-results">Error loading materials.</p>';
    }
}

async function loadSellers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        // Filter for sellers and artisans who sell raw materials
        const sellers = users.filter(user => user.role === 'seller');
        const artisans = users.filter(user => user.role === 'artisan');
        
        // Get products to check which artisans sell raw materials
        const productsResponse = await fetch('/api/products');
        const products = await productsResponse.json();
        const rawMaterialProducts = products.filter(product => product.category === 'raw_material');
        
        // Find artisans who sell raw materials
        const artisansWithRawMaterials = artisans.filter(artisan => 
            rawMaterialProducts.some(product => product.artisan_id == artisan.id)
        );
        
        // Combine sellers and artisans who sell raw materials
        const allSellers = [...sellers, ...artisansWithRawMaterials];
        displaySellers(allSellers);
    } catch (error) {
        console.error('Error loading sellers:', error);
        document.getElementById('sellersGrid').innerHTML = '<p class="no-results">Error loading sellers.</p>';
    }
}

function displayMaterials(materials) {
    const materialsGrid = document.getElementById('materialsGrid');
    
    if (materials.length === 0) {
        materialsGrid.innerHTML = '<p class="no-results">No raw materials found.</p>';
        return;
    }
    
    materialsGrid.innerHTML = materials.map(material => `
        <div class="material-card">
            <img src="${material.img || 'https://via.placeholder.com/300x200'}" alt="${material.name}">
            <h3>${material.name}</h3>
            <div class="price">$${material.price}</div>
            <div class="seller-info">
                <p><strong>Seller ID:</strong> ${material.artisan_id}</p>
                <p><strong>Category:</strong> ${material.category.replace('_', ' ')}</p>
            </div>
            <button class="contact-seller-btn" onclick="contactSeller(${material.artisan_id})">
                Contact Seller
            </button>
        </div>
    `).join('');
}

function displaySellers(sellers) {
    const sellersGrid = document.getElementById('sellersGrid');
    
    if (sellers.length === 0) {
        sellersGrid.innerHTML = '<p class="no-results">No sellers found.</p>';
        return;
    }
    
    sellersGrid.innerHTML = sellers.map(seller => `
        <div class="seller-card">
            <h3>${seller.name}</h3>
            <p><strong>Email:</strong> ${seller.email}</p>
            <p><strong>Role:</strong> ${seller.role === 'seller' ? 'Raw Material Seller' : 'Artisan (Raw Materials)'}</p>
            <div class="seller-stats">
                <p>Materials Available: ${seller.total_reviews || 0}</p>
                <p>Average Rating: ${seller.average_rating ? seller.average_rating.toFixed(1) : 'N/A'}</p>
            </div>
            <button class="contact-seller-btn" onclick="contactSeller(${seller.id})">
                Contact ${seller.role === 'seller' ? 'Seller' : 'Artisan'}
            </button>
        </div>
    `).join('');
}

async function searchMaterials() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        let filteredMaterials = products.filter(product => product.category === 'raw_material');
        
        // Apply search term filter
        if (searchTerm) {
            filteredMaterials = filteredMaterials.filter(material => 
                material.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter (though all are raw_material, this is for future expansion)
        if (categoryFilter) {
            filteredMaterials = filteredMaterials.filter(material => 
                material.category === categoryFilter
            );
        }
        
        // Apply price filter
        if (priceFilter) {
            filteredMaterials = filteredMaterials.filter(material => {
                const price = material.price;
                switch (priceFilter) {
                    case '0-25': return price < 25;
                    case '25-50': return price >= 25 && price <= 50;
                    case '50-100': return price >= 50 && price <= 100;
                    case '100+': return price > 100;
                    default: return true;
                }
            });
        }
        
        displayMaterials(filteredMaterials);
    } catch (error) {
        console.error('Error searching materials:', error);
        document.getElementById('materialsGrid').innerHTML = '<p class="no-results">Error searching materials.</p>';
    }
}

function contactSeller(sellerId) {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId) {
        alert('Please login to contact sellers.');
        return;
    }
    
    // Prevent self-chat
    if (parseInt(sellerId) === parseInt(userId)) {
        alert('You cannot chat with yourself.');
        return;
    }
    
    // Get seller info
    fetch('/api/users')
        .then(response => response.json())
        .then(users => {
            const seller = users.find(user => user.id == sellerId && (user.role === 'seller' || user.role === 'artisan'));
            if (!seller) {
                alert('Seller not found.');
                return;
            }
            
            // Store chat session data
            const chatSession = {
                artisanId: sellerId,
                artisanName: seller.name,
                artisanEmail: seller.email,
                customerId: userId,
                customerName: userName,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('currentChat', JSON.stringify(chatSession));
            
            // Open chat window
            window.open('chat.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        })
        .catch(error => {
            console.error('Error fetching seller info:', error);
            alert('Error loading seller information.');
        });
}

// Add API endpoint for getting all users (needed for sellers)
// This should be added to the server, but for now we'll handle the error gracefully
async function loadSellers() {
    try {
        // Try to fetch users, but handle the case where this endpoint doesn't exist yet
        const response = await fetch('/api/users');
        if (!response.ok) {
            // If endpoint doesn't exist, create mock seller data
            const mockSellers = [
                { id: 5, name: 'RawMat Seller', email: 'seller@example.com', role: 'seller', total_reviews: 2, average_rating: 4.5 }
            ];
            displaySellers(mockSellers);
            return;
        }
        
        const users = await response.json();
        const sellers = users.filter(user => user.role === 'seller');
        displaySellers(sellers);
    } catch (error) {
        console.error('Error loading sellers:', error);
        // Fallback to mock data
        const mockSellers = [
            { id: 5, name: 'RawMat Seller', email: 'seller@example.com', role: 'seller', total_reviews: 2, average_rating: 4.5 }
        ];
        displaySellers(mockSellers);
    }
}
