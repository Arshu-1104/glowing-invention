document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    const queriesList = document.getElementById('queriesList');
    
    // Check if user is an artisan or seller
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (!userId || (userRole !== 'artisan' && userRole !== 'seller')) {
        queriesList.innerHTML = '<div class="no-queries">Access denied. Only artisans and sellers can view product queries.</div>';
        return;
    }
    
    // Load and display queries
    const loadQueries = async () => {
        try {
            const response = await fetch(`/api/chat/sessions/${userId}?role=artisan`);
            const data = await response.json();
            
            if (response.ok) {
                const queries = data.map(session => ({
                    id: `chat_${session.customer_id}_${session.artisan_id}`,
                    customerId: session.customer_id,
                    customerName: session.customer_name,
                    lastMessage: session.last_message || 'No messages yet',
                    timestamp: session.updated_at,
                    messageCount: session.message_count,
                    isNew: session.last_message && session.last_message.includes('customer')
                }));
                
                displayQueries(queries);
            } else {
                console.error('Failed to load queries:', data.message);
                queriesList.innerHTML = '<div class="no-queries">Error loading queries.</div>';
            }
        } catch (error) {
            console.error('Error loading queries:', error);
            queriesList.innerHTML = '<div class="no-queries">Error loading queries.</div>';
        }
    };
    
    // Display queries
    const displayQueries = (queries) => {
        if (queries.length === 0) {
            queriesList.innerHTML = '<div class="no-queries">No customer queries yet. Customers will appear here when they start a chat.</div>';
            return;
        }
        
        queriesList.innerHTML = queries.map(query => `
            <div class="query-item" onclick="openChat('${query.id}')">
                <div class="query-header">
                    <div class="query-customer">${query.customerName}</div>
                    <div class="query-time">${new Date(query.timestamp).toLocaleString()}</div>
                </div>
                <div class="query-preview">${query.lastMessage}</div>
                <div class="query-status ${query.isNew ? 'status-new' : 'status-replied'}">
                    ${query.isNew ? 'New Message' : 'Replied'} (${query.messageCount} messages)
                </div>
            </div>
        `).join('');
    };
    
    // Open chat with customer
    window.openChat = (chatId) => {
        // Store the chat ID for the artisan to access
        localStorage.setItem('artisanChatId', chatId);
        
        // Open chat window
        window.open('artisan-chat.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    };
    
    // Initialize
    loadQueries();
    
    // Refresh queries every 30 seconds
    setInterval(loadQueries, 30000);
});
