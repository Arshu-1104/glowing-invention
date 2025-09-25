document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    loadRawMaterials();
    
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
            <div class="price">${material.price}</div>
            <div class="seller-info">
                <p><strong>Seller ID:</strong> ${material.artisan_id}</p>
                <p><strong>Category:</strong> ${material.category.replace('_', ' ')}</p>
            </div>
            <button class="contact-seller-btn" onclick="contactSeller(${material.artisan_id})">
                Contact Seller
            </button>
            <button class="purchase-btn" onclick="openPurchaseModal(${material.id}, ${material.price})">
                Purchase
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

function openPurchaseModal(productId, price) {
    document.getElementById('purchaseProductId').value = productId;
    document.getElementById('purchaseProductPrice').value = price;
    document.getElementById('quantity').value = 1;
    updateTotalPrice();
    document.getElementById('purchaseModal').style.display = 'block';
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
}

document.getElementById('quantity').addEventListener('input', updateTotalPrice);

function updateTotalPrice() {
    const price = parseFloat(document.getElementById('purchaseProductPrice').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const totalPrice = price * quantity;
    document.getElementById('totalPrice').textContent = `Total: ${totalPrice.toFixed(2)}`;
}

document.getElementById('purchaseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('purchaseProductId').value;
    const quantity = document.getElementById('quantity').value;
    const shippingAddress = document.getElementById('shippingAddress').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        alert('Please log in to make a purchase.');
        return;
    }
    
    try {
        const response = await fetch('/api/purchases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                product_id: productId,
                user_id: userId,
                quantity: quantity,
                shipping_address: shippingAddress,
                payment_method: paymentMethod
            })
        });
        
        const result = await response.json();
        
        const messageEl = document.getElementById('purchaseMessage');
        if (response.ok) {
            messageEl.textContent = 'Purchase successful!';
            messageEl.className = 'message success';
            setTimeout(() => {
                closePurchaseModal();
            }, 2000);
        } else {
            messageEl.textContent = result.message || 'Purchase failed.';
            messageEl.className = 'message error';
        }
    } catch (error) {
        console.error('Error making purchase:', error);
        const messageEl = document.getElementById('purchaseMessage');
        messageEl.textContent = 'An error occurred. Please try again.';
        messageEl.className = 'message error';
    }
});

