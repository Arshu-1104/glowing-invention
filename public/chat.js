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
    
    let chatSession = null;
    let sessionId = null;
    let messages = [];
    let lastMessageId = 0;
    let pollingInterval = null;
    
    // Load chat session
    const loadChatSession = async () => {
        const sessionData = localStorage.getItem('currentChat');
        if (sessionData) {
            chatSession = JSON.parse(sessionData);
            chatTitle.textContent = `Chat with ${chatSession.artisanName}`;
            chatSubtitle.textContent = `Artisan: ${chatSession.artisanName} | Customer: ${chatSession.customerName}`;
            
            // Get or create session on server
            try {
                const response = await fetch('/api/chat/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        artisan_id: chatSession.artisanId,
                        customer_id: chatSession.customerId
                    })
                });
                
                const data = await response.json();
                if (response.ok) {
                    sessionId = data.session_id;
                    await loadMessages();
                    startPolling();
                } else {
                    console.error('Failed to create/get session:', data.message);
                }
            } catch (error) {
                console.error('Error creating session:', error);
            }
        } else {
            chatTitle.textContent = 'No Active Chat';
            chatSubtitle.textContent = 'Please start a chat from the main page';
            messageInput.disabled = true;
            sendButton.disabled = true;
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
            <div class="message ${msg.sender === 'customer' ? 'sent' : 'received'}">
                <div class="message-info">
                    ${msg.sender === 'customer' ? chatSession.customerName : chatSession.artisanName} - ${new Date(msg.timestamp).toLocaleTimeString()}
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
                    sender_id: chatSession.customerId,
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
    if (chatSession) {
        loadMessages();
    }
});
