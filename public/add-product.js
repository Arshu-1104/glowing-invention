
document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    const addProductForm = document.getElementById('addProductForm');
    const messageElement = document.getElementById('message');

    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (!userId || (userRole !== 'artisan' && userRole !== 'seller')) {
        messageElement.textContent = 'You must be logged in as an Artisan or Raw Material Seller to add products.';
        messageElement.classList.add('error');
        addProductForm.style.display = 'none';
        return;
    }

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productName = document.getElementById('productName').value;
        const category = document.getElementById('category').value;
        const price = parseFloat(document.getElementById('price').value);
        const imageFiles = document.getElementById('imageFiles').files;

        if (!productName || !category || isNaN(price)) {
            messageElement.textContent = 'Please fill in all required fields.';
            messageElement.classList.add('error');
            messageElement.classList.remove('success');
            return;
        }

        try {
            // Create product first to get the product ID
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    name: productName, 
                    category, 
                    price, 
                    artisan_id: userId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                messageElement.textContent = data.message || 'Failed to add product.';
                messageElement.classList.add('error');
                messageElement.classList.remove('success');
                return;
            }

            // Upload images with the correct product ID
            const imagePaths = [];
            if (imageFiles.length > 0) {
                for (let i = 0; i < imageFiles.length; i++) {
                    const formData = new FormData();
                    formData.append('image', imageFiles[i]);
                    formData.append('productId', data.productId);
                    formData.append('imageNumber', i + 1);
                    
                    const uploadResponse = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        imagePaths.push(uploadData.imagePath);
                    }
                }

                // Update product with image paths
                if (imagePaths.length > 0) {
                    const updateResponse = await fetch(`/api/products/${data.productId}/images`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ images: imagePaths }),
                    });
                }
            }

            messageElement.textContent = 'Product added successfully!';
            messageElement.classList.add('success');
            messageElement.classList.remove('error');
            addProductForm.reset();
        } catch (error) {
            console.error('Error adding product:', error);
            messageElement.textContent = 'An error occurred. Please try again later.';
            messageElement.classList.add('error');
            messageElement.classList.remove('success');
        }
    });
});
