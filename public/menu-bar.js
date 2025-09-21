// Professional Menu Bar Component
class MenuBar {
    constructor() {
        this.userId = localStorage.getItem('userId');
        this.userName = localStorage.getItem('userName');
        this.userRole = localStorage.getItem('userRole');
    }

    render() {
        const menuBar = document.createElement('nav');
        menuBar.className = 'professional-menu-bar';
        menuBar.innerHTML = `
            <div class="menu-container">
                <div class="menu-brand">
                    <a href="/" class="brand-link">
                        <span class="brand-icon">🎨</span>
                        <span class="brand-text">Artisan Marketplace</span>
                    </a>
                </div>
                
                <div class="menu-links">
                    <a href="/" class="menu-link">Home</a>
                    <a href="/raw-materials.html" class="menu-link">Raw Materials</a>
                    ${this.getRoleBasedLinks()}
                </div>
                
                <div class="menu-user">
                    ${this.userId ? this.renderUserMenu() : this.renderAuthButtons()}
                </div>
            </div>
        `;

        return menuBar;
    }

    getRoleBasedLinks() {
        if (!this.userId) return '';
        
        let links = '';
        
        if (this.userRole === 'artisan' || this.userRole === 'seller') {
            links += `<a href="/add-product.html" class="menu-link">Add Product</a>`;
            links += `<a href="/product-queries.html" class="menu-link">Product Queries</a>`;
        }
        
        return links;
    }

    renderUserMenu() {
        return `
            <div class="user-menu-container">
                <button class="user-menu-button" onclick="toggleUserMenu()">
                    <span class="user-avatar">👤</span>
                    <span class="user-name">${this.userName || 'User'}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div id="userMenu" class="user-menu">
                    <div class="user-menu-header">
                        <div class="user-info">
                            <h3>${this.userName || 'User'}</h3>
                            <p class="user-role">${this.userRole || 'User'}</p>
                        </div>
                    </div>
                    <div class="user-menu-actions">
                        <button onclick="viewProfile()" class="menu-action">
                            <span class="action-icon">👤</span>
                            View Profile
                        </button>
                        <button onclick="viewShoppingHistory()" class="menu-action">
                            <span class="action-icon">📦</span>
                            Shopping History
                        </button>
                        <button onclick="editProfile()" class="menu-action">
                            <span class="action-icon">✏️</span>
                            Edit Profile
                        </button>
                        <div class="menu-divider"></div>
                        <button onclick="logout()" class="menu-action logout">
                            <span class="action-icon">🚪</span>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderAuthButtons() {
        return `
            <div class="auth-buttons">
                <a href="/login.html" class="btn btn-outline">Sign In</a>
                <a href="/login.html" class="btn btn-primary">Get Started</a>
            </div>
        `;
    }
}

// Global functions for user menu
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('show');
    }
}

function viewProfile() {
    // Close menu first
    toggleUserMenu();
    // Open profile modal
    if (typeof openUserInfoModal === 'function') {
        openUserInfoModal();
    }
}

function viewShoppingHistory() {
    // Close menu first
    toggleUserMenu();
    // Open shopping history modal
    if (typeof openShoppingHistoryModal === 'function') {
        openShoppingHistoryModal();
    }
}

function editProfile() {
    // Close menu first
    toggleUserMenu();
    // For now, just show an alert - can be expanded later
    alert('Edit Profile functionality coming soon!');
}

function logout() {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentChat');
    localStorage.removeItem('artisanChatId');
    
    // Redirect to home page
    window.location.href = '/';
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const userMenuButton = document.querySelector('.user-menu-button');
    
    if (userMenu && userMenuButton && !userMenu.contains(e.target) && !userMenuButton.contains(e.target)) {
        userMenu.classList.remove('show');
    }
});

// Export for use in other files
window.MenuBar = MenuBar;
