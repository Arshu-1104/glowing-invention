document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu bar
    const menuBarContainer = document.getElementById('menuBarContainer');
    const menuBar = new MenuBar();
    menuBarContainer.appendChild(menuBar.render());

    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatTitle = document.getElementById('chatTitle');
    const chatSubtitle = document.getElementById('chatSubtitle');
    
    let sessionId = null;
    let messages = [];
    let customerInfo = null;
    let lastMessageId = 0;
    let pollingInterval = null;
    
    // Load chat session
    const loadChatSession = async () => {
        const chatId = localStorage.getItem('artisanChatId');
        
        if (!chatId) {
            chatTitle.textContent = 'No Active Chat';
            chatSubtitle.textContent = 'Please select a chat from the Product Queries page';
            messageInput.disabled = true;
            sendButton.disabled = true;
            return;
        }
        
        // Extract customer info from chat ID
        const parts = chatId.split('_');
        const customerId = parts[1];
        const artisanId = parts[2];
        
        // Get customer info from server
        try {
            const response = await fetch(`/api/users/${customerId}`);
            const customerData = await response.json();
            
            const customerName = customerData.name || 'Customer';
            const artisanName = localStorage.getItem('userName') || 'Artisan/Seller';
            
            customerInfo = {
                customerId: customerId,
                customerName: customerName,
                artisanId: artisanId,
                artisanName: artisanName
            };
            
            chatTitle.textContent = `Chat with ${customerName}`;
            chatSubtitle.textContent = `Customer: ${customerName} | Artisan: ${artisanName}`;
            
            // Get or create session from server
            const sessionResponse = await fetch('/api/chat/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    artisan_id: artisanId,
                    customer_id: customerId
                })
            });
            const sessionData = await sessionResponse.json();
            
            if (sessionResponse.ok) {
                sessionId = sessionData.session_id;
                await loadMessages();
                startPolling();
            } else {
                console.error('Failed to get/create session:', sessionData.message);
                chatTitle.textContent = 'Session Error';
                chatSubtitle.textContent = 'Could not create or find chat session';
            }
        } catch (error) {
            console.error('Error loading chat session:', error);
            chatTitle.textContent = 'Error Loading Chat';
            chatSubtitle.textContent = 'Failed to load chat information';
        }
    };
    
    // Load messages from server
    const loadMessages = async () => {
        if (!sessionId) return;
        
        try {
            const response = await fetch(`/api/chat/session/${sessionId}/messages`);
            const data = await response.json();
            
            if (response.ok) {
                const newMessages = data.map(msg => ({
                    id: msg.id,
                    text: msg.message_text,
                    sender: msg.sender_role === 'artisan' ? 'artisan' : 'customer',
                    timestamp: msg.created_at,
                    senderName: msg.sender_name
                }));
                
                // Only update if there are new messages
                if (newMessages.length !== messages.length || 
                    (newMessages.length > 0 && newMessages[newMessages.length - 1].id !== lastMessageId)) {
                    messages = newMessages;
                    lastMessageId = newMessages.length > 0 ? newMessages[newMessages.length - 1].id : 0;
                    displayMessages();
                }
            } else {
                console.error('Failed to load messages:', data.message);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };
    
    // Display messages
    const displayMessages = () => {
        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
            return;
        }
        
        chatMessages.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender === 'artisan' ? 'sent' : 'received'}">
                <div class="message-info">
                    ${msg.sender === 'artisan' ? customerInfo.artisanName : customerInfo.customerName} - ${new Date(msg.timestamp).toLocaleTimeString()}
                </div>
                <div>${msg.text}</div>
            </div>
        `).join('');
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    // Send message
    const sendMessage = async () => {
        const text = messageInput.value.trim();
        if (!text || !sessionId) return;
        
        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    sender_id: customerInfo.artisanId,
                    message_text: text
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                // Reload messages from server
                await loadMessages();
                messageInput.value = '';
            } else {
                console.error('Failed to send message:', data.message);
                alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        }
    };
    
    // Start polling for new messages
    const startPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        pollingInterval = setInterval(loadMessages, 2000); // Poll every 2 seconds
    };
    
    // Stop polling
    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    };
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopPolling();
    });
    
    // Initialize
    loadChatSession();
});
