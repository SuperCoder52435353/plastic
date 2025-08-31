// Virtual Card Banking System - Frontend Only
// All data stored in localStorage for demo purposes

const DB_KEY = 'cardSimDB';
const ADMIN_PASSWORD = 'PASSWORDABDURAXMON';

// Database structure
let db = {
    users: [],
    cards: [],
    applications: [],
    admin: {
        inbox: [],
        notifications: [],
        selectedUserId: null
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadDB();
    setupEventListeners();
    showLoginScreen();
});

// Database utilities
function loadDB() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
        db = JSON.parse(saved);
    }
}

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDB() {
    localStorage.removeItem(DB_KEY);
    db = {
        users: [],
        cards: [],
        applications: [],
        admin: {
            inbox: [],
            notifications: [],
            selectedUserId: null
        }
    };
    saveDB();
    showToast('Demo reset successfully', 'success');
    showLoginScreen();
}

// Utility functions
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatPAN(pan) {
    return pan.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function maskedPAN(pan) {
    return '•••• •••• •••• ' + pan.slice(-4);
}

function formatDate(date) {
    return new Date(date).toLocaleString();
}

function generatePAN() {
    // Generate a 16-digit PAN starting with 4 (Visa-like)
    let pan = '4';
    
    // Generate 14 random digits
    for (let i = 0; i < 14; i++) {
        pan += Math.floor(Math.random() * 10);
    }
    
    // Calculate Luhn check digit
    let sum = 0;
    let isEven = false;
    
    for (let i = pan.length - 1; i >= 0; i--) {
        let digit = parseInt(pan[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return pan + checkDigit;
}

function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiry() {
    const now = new Date();
    const year = now.getFullYear() + 3; // 3 years from now
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return `${month}/${year.toString().slice(-2)}`;
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showLoginScreen() {
    showScreen('loginScreen');
    clearSession();
}

function showUserDashboard(userId) {
    sessionStorage.setItem('currentUserId', userId);
    sessionStorage.setItem('userType', 'user');
    showScreen('userDashboard');
    renderUserDashboard(userId);
}

function showAdminDashboard() {
    sessionStorage.setItem('userType', 'admin');
    showScreen('adminDashboard');
    renderAdminDashboard();
}

function clearSession() {
    sessionStorage.removeItem('currentUserId');
    sessionStorage.removeItem('userType');
}

// Authentication
function setupEventListeners() {
    // Login tabs
    document.getElementById('userLoginTab').addEventListener('click', () => switchTab('userLoginForm'));
    document.getElementById('adminLoginTab').addEventListener('click', () => switchTab('adminLoginForm'));
    document.getElementById('signupTab').addEventListener('click', () => switchTab('signupForm'));

    // Login forms
    document.getElementById('userLoginForm').addEventListener('submit', handleUserLogin);
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Logout buttons
    document.getElementById('userLogout').addEventListener('click', showLoginScreen);
    document.getElementById('adminLogout').addEventListener('click', showLoginScreen);

    // Reset demo
    document.getElementById('resetDemo').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the demo? All data will be lost.')) {
            resetDB();
        }
    });

    // User dashboard
    document.getElementById('applyForCard').addEventListener('click', applyForCard);
    document.getElementById('transferForm').addEventListener('submit', handleTransfer);
    document.getElementById('sendUserMessage').addEventListener('click', sendUserMessage);
    document.getElementById('userNotifications').addEventListener('click', showUserNotifications);

    // Admin dashboard
    document.getElementById('createCardForm').addEventListener('submit', handleCreateCard);
    document.getElementById('broadcastPayoutForm').addEventListener('submit', handleBroadcastPayout);
    document.getElementById('sendAdminMessage').addEventListener('click', sendAdminMessage);
    document.getElementById('adminNotifications').addEventListener('click', showAdminNotifications);

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchAdminTab(e.target.dataset.tab));
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('notificationsModal').addEventListener('click', (e) => {
        if (e.target.id === 'notificationsModal') closeModal();
    });

    // Format PAN input
    document.getElementById('destinationPAN').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        e.target.value = formatPAN(value);
    });
}

function switchTab(formId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update forms
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    document.getElementById(formId).classList.add('active');
}

function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;

    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        showUserDashboard(user.id);
        showToast('Login successful', 'success');
    } else {
        showToast('Invalid credentials', 'error');
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;

    if (password === ADMIN_PASSWORD) {
        showAdminDashboard();
        showToast('Admin login successful', 'success');
    } else {
        showToast('Invalid admin password', 'error');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    // Check if email already exists
    if (db.users.find(u => u.email === email)) {
        showToast('Email already registered', 'error');
        return;
    }

    const userId = uid();
    const newUser = {
        id: userId,
        name,
        email,
        password,
        messages: [],
        notifications: []
    };

    db.users.push(newUser);
    
    // Add notification to admin
    addAdminNotification('New User Registration', `${name} (${email}) has registered`);
    
    saveDB();
    showToast('Account created successfully', 'success');
    
    // Clear form and switch to user login
    document.getElementById('signupForm').reset();
    switchTab('userLoginForm');
}

// User Dashboard
function renderUserDashboard(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('userName').textContent = `Welcome, ${user.name}`;
    document.getElementById('userEmail').textContent = user.email;

    renderUserCards(userId);
    renderUserTransferOptions(userId);
    renderUserChat(userId);
    updateUserNotificationCount(userId);
}

function renderUserCards(userId) {
    const userCards = db.cards.filter(c => c.userId === userId);
    const container = document.getElementById('userCards');
    
    if (userCards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h4>No Cards Yet</h4>
                <p>Apply for your first virtual card to get started</p>
            </div>
        `;
        return;
    }

    container.innerHTML = userCards.map(card => {
        const template = document.getElementById('cardTemplate').content.cloneNode(true);
        const cardElement = template.querySelector('.card');
        
        cardElement.dataset.cardId = card.id;
        cardElement.classList.toggle('frozen', card.frozen);
        
        // Replace template placeholders
        cardElement.innerHTML = cardElement.innerHTML
            .replace(/{cardId}/g, card.id);
        
        cardElement.querySelector('[data-testid^="text-card-number"]').textContent = maskedPAN(card.pan);
        cardElement.querySelector('[data-testid^="text-card-holder"]').textContent = card.holderName.toUpperCase();
        cardElement.querySelector('[data-testid^="text-card-expiry"]').textContent = card.exp;
        cardElement.querySelector('[data-testid^="text-card-balance"]').textContent = formatCurrency(card.balance);
        
        const freezeBtn = cardElement.querySelector('[data-testid^="button-freeze"]');
        freezeBtn.textContent = card.frozen ? 'Unfreeze' : 'Freeze';
        freezeBtn.addEventListener('click', () => toggleCardFreeze(card.id));
        
        cardElement.querySelector('[data-testid^="button-details"]').addEventListener('click', () => showCardDetails(card.id));
        
        return cardElement.outerHTML;
    }).join('');
}

function renderUserTransferOptions(userId) {
    const userCards = db.cards.filter(c => c.userId === userId && !c.frozen);
    const select = document.getElementById('sourceCard');
    
    select.innerHTML = '<option value="">Select your card</option>';
    userCards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;
        option.textContent = `${maskedPAN(card.pan)} - ${formatCurrency(card.balance)}`;
        select.appendChild(option);
    });
}

function renderUserChat(userId) {
    const user = db.users.find(u => u.id === userId);
    const container = document.getElementById('userChatMessages');
    
    if (!user.messages || user.messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No messages yet. Send a message to admin for support.</p></div>';
        return;
    }

    container.innerHTML = user.messages.map(msg => {
        const template = document.getElementById('messageTemplate').content.cloneNode(true);
        const messageElement = template.querySelector('.message');
        
        messageElement.classList.add(msg.sender === 'user' ? 'user' : 'admin');
        messageElement.querySelector('.message-sender').textContent = msg.sender === 'user' ? user.name : 'Admin';
        messageElement.querySelector('.message-content').textContent = msg.content;
        messageElement.querySelector('.message-time').textContent = formatDate(msg.timestamp);
        
        return messageElement.outerHTML;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

function applyForCard() {
    const userId = sessionStorage.getItem('currentUserId');
    const user = db.users.find(u => u.id === userId);
    
    // Check if user already has a pending application
    const existingApp = db.applications.find(app => app.userId === userId && app.status === 'pending');
    if (existingApp) {
        showToast('You already have a pending application', 'warning');
        return;
    }

    const applicationId = uid();
    const application = {
        id: applicationId,
        userId,
        userEmail: user.email,
        userName: user.name,
        timestamp: Date.now(),
        status: 'pending'
    };

    db.applications.push(application);
    addAdminNotification('New Card Application', `${user.name} applied for a new card`);
    addUserNotification(userId, 'Application Submitted', 'Your card application has been submitted and is pending review');
    
    saveDB();
    showToast('Card application submitted successfully', 'success');
    updateUserNotificationCount(userId);
}

function handleTransfer(e) {
    e.preventDefault();
    const sourceCardId = document.getElementById('sourceCard').value;
    const destinationPAN = document.getElementById('destinationPAN').value.replace(/\s/g, '');
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const note = document.getElementById('transferNote').value || 'Transfer';

    // Validation
    if (!sourceCardId || !destinationPAN || !amount) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (destinationPAN.length !== 16) {
        showToast('Card number must be 16 digits', 'error');
        return;
    }

    const sourceCard = db.cards.find(c => c.id === sourceCardId);
    const destinationCard = db.cards.find(c => c.pan === destinationPAN);

    if (!sourceCard) {
        showToast('Source card not found', 'error');
        return;
    }

    if (sourceCard.frozen) {
        showToast('Cannot transfer from frozen card', 'error');
        return;
    }

    if (!destinationCard) {
        showToast('Destination card not found', 'error');
        return;
    }

    if (sourceCard.balance < amount) {
        showToast('Insufficient balance', 'error');
        return;
    }

    // Perform transfer
    sourceCard.balance -= amount;
    destinationCard.balance += amount;

    // Add notifications
    const sourceUser = db.users.find(u => u.id === sourceCard.userId);
    const destUser = db.users.find(u => u.id === destinationCard.userId);

    addUserNotification(sourceCard.userId, 'Transfer Sent', `${formatCurrency(amount)} sent to ${maskedPAN(destinationPAN)}`);
    addUserNotification(destinationCard.userId, 'Transfer Received', `${formatCurrency(amount)} received from ${sourceUser.name}`);
    addAdminNotification('Transfer Completed', `${formatCurrency(amount)} transferred from ${sourceUser.name} to ${destUser.name}`);

    saveDB();
    showToast('Transfer completed successfully', 'success');
    
    // Reset form and update UI
    document.getElementById('transferForm').reset();
    renderUserCards(sessionStorage.getItem('currentUserId'));
    renderUserTransferOptions(sessionStorage.getItem('currentUserId'));
    updateUserNotificationCount(sessionStorage.getItem('currentUserId'));
}

function toggleCardFreeze(cardId) {
    const card = db.cards.find(c => c.id === cardId);
    if (!card) return;

    card.frozen = !card.frozen;
    
    const user = db.users.find(u => u.id === card.userId);
    const action = card.frozen ? 'frozen' : 'unfrozen';
    
    addUserNotification(card.userId, 'Card Status Changed', `Your card ${maskedPAN(card.pan)} has been ${action}`);
    addAdminNotification('Card Status Change', `${user.name}'s card was ${action}`);
    
    saveDB();
    showToast(`Card ${action} successfully`, 'success');
    renderUserCards(card.userId);
}

function showCardDetails(cardId) {
    const card = db.cards.find(c => c.id === cardId);
    if (!card) return;

    const details = `
        Card Number: ${formatPAN(card.pan)}
        CVV: ${card.cvv}
        Expiry: ${card.exp}
        Balance: ${formatCurrency(card.balance)}
        Status: ${card.frozen ? 'Frozen' : 'Active'}
        
        ⚠️ This is demo data only. Do not use real card information.
    `;
    
    alert(details);
}

function sendUserMessage() {
    const userId = sessionStorage.getItem('currentUserId');
    const input = document.getElementById('userChatInput');
    const content = input.value.trim();
    
    if (!content) return;

    const user = db.users.find(u => u.id === userId);
    const message = {
        id: uid(),
        sender: 'user',
        content,
        timestamp: Date.now()
    };

    user.messages.push(message);
    
    // Add to admin inbox
    if (!db.admin.inbox.find(msg => msg.userId === userId)) {
        db.admin.inbox.push({
            userId,
            userName: user.name,
            userEmail: user.email,
            lastMessage: content,
            timestamp: Date.now(),
            unread: true
        });
    } else {
        const inboxItem = db.admin.inbox.find(msg => msg.userId === userId);
        inboxItem.lastMessage = content;
        inboxItem.timestamp = Date.now();
        inboxItem.unread = true;
    }

    addAdminNotification('New Message', `${user.name} sent a message`);
    
    saveDB();
    input.value = '';
    renderUserChat(userId);
    showToast('Message sent', 'success');
}

// Admin Dashboard
function renderAdminDashboard() {
    renderApplications();
    renderUsers();
    renderAdminChat();
    updateAdminNotificationCount();
    populateUserSelectForCard();
}

function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function renderApplications() {
    const pendingApps = db.applications.filter(app => app.status === 'pending');
    const container = document.getElementById('applicationsList');
    const countElement = document.getElementById('pendingApplicationsCount');
    
    countElement.textContent = pendingApps.length;
    countElement.style.display = pendingApps.length > 0 ? 'inline-block' : 'none';

    if (pendingApps.length === 0) {
        container.innerHTML = '<div class="empty-state"><h4>No Pending Applications</h4><p>All applications have been processed</p></div>';
        return;
    }

    container.innerHTML = pendingApps.map(app => {
        const template = document.getElementById('applicationTemplate').content.cloneNode(true);
        const appElement = template.querySelector('.application-item');
        
        appElement.innerHTML = appElement.innerHTML.replace(/{applicationId}/g, app.id);
        appElement.querySelector('[data-testid^="text-applicant-name"]').textContent = app.userName;
        appElement.querySelector('[data-testid^="text-applicant-email"]').textContent = app.userEmail;
        appElement.querySelector('[data-testid^="text-application-date"]').textContent = formatDate(app.timestamp);
        
        appElement.querySelector('[data-testid^="button-approve"]').addEventListener('click', () => approveApplication(app.id));
        appElement.querySelector('[data-testid^="button-reject"]').addEventListener('click', () => rejectApplication(app.id));
        
        return appElement.outerHTML;
    }).join('');
}

function renderUsers() {
    const container = document.getElementById('usersList');
    
    if (db.users.length === 0) {
        container.innerHTML = '<div class="empty-state"><h4>No Users</h4><p>No users have registered yet</p></div>';
        return;
    }

    container.innerHTML = db.users.map(user => {
        const userCards = db.cards.filter(c => c.userId === user.id);
        const template = document.getElementById('userItemTemplate').content.cloneNode(true);
        const userElement = template.querySelector('.user-item');
        
        userElement.innerHTML = userElement.innerHTML.replace(/{userId}/g, user.id);
        userElement.querySelector('[data-testid^="text-user-name"]').textContent = user.name;
        userElement.querySelector('[data-testid^="text-user-email"]').textContent = user.email;
        userElement.querySelector('[data-testid^="text-user-cards-count"]').textContent = `${userCards.length} cards`;
        
        userElement.querySelector('[data-testid^="button-chat"]').addEventListener('click', () => selectUserForChat(user.id));
        userElement.querySelector('[data-testid^="button-freeze-all"]').addEventListener('click', () => freezeAllUserCards(user.id));
        
        return userElement.outerHTML;
    }).join('');
}

function renderAdminChat() {
    const container = document.getElementById('chatUsersList');
    
    if (db.admin.inbox.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No conversations</p></div>';
        return;
    }

    container.innerHTML = db.admin.inbox.map(conversation => {
        const isSelected = db.admin.selectedUserId === conversation.userId;
        return `
            <div class="chat-user-item ${isSelected ? 'active' : ''}" 
                 onclick="selectUserForChat('${conversation.userId}')"
                 data-testid="chat-user-${conversation.userId}">
                <div class="user-name">${conversation.userName}</div>
                <div class="last-message">${conversation.lastMessage}</div>
                <div class="message-time">${formatDate(conversation.timestamp)}</div>
                ${conversation.unread ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `;
    }).join('');

    // Render selected user's conversation
    if (db.admin.selectedUserId) {
        renderSelectedUserChat();
    }
}

function selectUserForChat(userId) {
    db.admin.selectedUserId = userId;
    
    // Mark as read
    const inboxItem = db.admin.inbox.find(item => item.userId === userId);
    if (inboxItem) {
        inboxItem.unread = false;
    }
    
    saveDB();
    renderAdminChat();
}

function renderSelectedUserChat() {
    const userId = db.admin.selectedUserId;
    const user = db.users.find(u => u.id === userId);
    const container = document.getElementById('adminChatMessages');
    
    if (!user || !user.messages || user.messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No messages in this conversation</p></div>';
        return;
    }

    container.innerHTML = user.messages.map(msg => {
        const template = document.getElementById('messageTemplate').content.cloneNode(true);
        const messageElement = template.querySelector('.message');
        
        messageElement.classList.add(msg.sender === 'user' ? 'user' : 'admin');
        messageElement.querySelector('.message-sender').textContent = msg.sender === 'user' ? user.name : 'Admin';
        messageElement.querySelector('.message-content').textContent = msg.content;
        messageElement.querySelector('.message-time').textContent = formatDate(msg.timestamp);
        
        return messageElement.outerHTML;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

function sendAdminMessage() {
    const userId = db.admin.selectedUserId;
    if (!userId) {
        showToast('Please select a user to message', 'warning');
        return;
    }

    const input = document.getElementById('adminChatInput');
    const content = input.value.trim();
    
    if (!content) return;

    const user = db.users.find(u => u.id === userId);
    const message = {
        id: uid(),
        sender: 'admin',
        content,
        timestamp: Date.now()
    };

    user.messages.push(message);
    addUserNotification(userId, 'New Message from Admin', content);
    
    saveDB();
    input.value = '';
    renderSelectedUserChat();
    showToast('Reply sent', 'success');
}

function approveApplication(applicationId) {
    const application = db.applications.find(app => app.id === applicationId);
    if (!application) return;

    // Create new card
    const cardId = uid();
    const user = db.users.find(u => u.id === application.userId);
    
    const newCard = {
        id: cardId,
        userId: application.userId,
        pan: generatePAN(),
        exp: generateExpiry(),
        cvv: generateCVV(),
        holderName: user.name,
        balance: 0,
        frozen: false
    };

    db.cards.push(newCard);
    application.status = 'approved';
    
    addUserNotification(application.userId, 'Card Approved!', 'Your virtual card has been approved and is ready to use');
    addAdminNotification('Card Issued', `New card issued to ${user.name}`);
    
    saveDB();
    showToast('Application approved and card created', 'success');
    renderApplications();
}

function rejectApplication(applicationId) {
    const application = db.applications.find(app => app.id === applicationId);
    if (!application) return;

    application.status = 'rejected';
    
    addUserNotification(application.userId, 'Application Update', 'Your card application was not approved at this time');
    
    saveDB();
    showToast('Application rejected', 'success');
    renderApplications();
}

function handleCreateCard(e) {
    e.preventDefault();
    const userId = document.getElementById('selectUserForCard').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;

    if (!userId) {
        showToast('Please select a user', 'error');
        return;
    }

    const user = db.users.find(u => u.id === userId);
    const cardId = uid();
    
    const newCard = {
        id: cardId,
        userId,
        pan: generatePAN(),
        exp: generateExpiry(),
        cvv: generateCVV(),
        holderName: user.name,
        balance: initialBalance,
        frozen: false
    };

    db.cards.push(newCard);
    
    addUserNotification(userId, 'New Card Created', `A new card with ${formatCurrency(initialBalance)} balance has been added to your account`);
    addAdminNotification('Card Created', `Card created for ${user.name} with ${formatCurrency(initialBalance)} balance`);
    
    saveDB();
    showToast('Card created successfully', 'success');
    
    document.getElementById('createCardForm').reset();
    renderUsers();
}

function handleBroadcastPayout(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('payoutAmount').value);

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    let usersAffected = 0;
    
    db.users.forEach(user => {
        const userCards = db.cards.filter(c => c.userId === user.id);
        if (userCards.length > 0) {
            // Credit first card
            userCards[0].balance += amount;
            addUserNotification(user.id, 'Payout Received', `${formatCurrency(amount)} has been added to your account`);
            usersAffected++;
        }
    });

    addAdminNotification('Broadcast Payout Sent', `${formatCurrency(amount)} sent to ${usersAffected} users`);
    
    saveDB();
    showToast(`Payout of ${formatCurrency(amount)} sent to ${usersAffected} users`, 'success');
    
    document.getElementById('broadcastPayoutForm').reset();
}

function freezeAllUserCards(userId) {
    const userCards = db.cards.filter(c => c.userId === userId);
    const user = db.users.find(u => u.id === userId);
    
    if (userCards.length === 0) {
        showToast('User has no cards', 'warning');
        return;
    }

    userCards.forEach(card => {
        card.frozen = true;
    });

    addUserNotification(userId, 'Cards Frozen', 'All your cards have been frozen by admin');
    addAdminNotification('Cards Frozen', `All cards for ${user.name} have been frozen`);
    
    saveDB();
    showToast(`All cards for ${user.name} have been frozen`, 'success');
}

function populateUserSelectForCard() {
    const select = document.getElementById('selectUserForCard');
    select.innerHTML = '<option value="">Select user</option>';
    
    db.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.email})`;
        select.appendChild(option);
    });
}

// Notifications
function addUserNotification(userId, title, message) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    if (!user.notifications) user.notifications = [];
    
    user.notifications.push({
        id: uid(),
        title,
        message,
        timestamp: Date.now(),
        read: false
    });
}

function addAdminNotification(title, message) {
    db.admin.notifications.push({
        id: uid(),
        title,
        message,
        timestamp: Date.now(),
        read: false
    });
}

function updateUserNotificationCount(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    const unreadCount = (user.notifications || []).filter(n => !n.read).length;
    const countElement = document.getElementById('userNotificationCount');
    
    countElement.textContent = unreadCount;
    countElement.classList.toggle('hidden', unreadCount === 0);
}

function updateAdminNotificationCount() {
    const unreadCount = db.admin.notifications.filter(n => !n.read).length;
    const countElement = document.getElementById('adminNotificationCount');
    
    countElement.textContent = unreadCount;
    countElement.classList.toggle('hidden', unreadCount === 0);
}

function showUserNotifications() {
    const userId = sessionStorage.getItem('currentUserId');
    const user = db.users.find(u => u.id === userId);
    
    renderNotificationsModal(user.notifications || []);
    
    // Mark all as read
    if (user.notifications) {
        user.notifications.forEach(n => n.read = true);
    }
    
    saveDB();
    updateUserNotificationCount(userId);
}

function showAdminNotifications() {
    renderNotificationsModal(db.admin.notifications);
    
    // Mark all as read
    db.admin.notifications.forEach(n => n.read = true);
    
    saveDB();
    updateAdminNotificationCount();
}

function renderNotificationsModal(notifications) {
    const container = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><h4>No Notifications</h4><p>You're all caught up!</p></div>';
    } else {
        container.innerHTML = notifications.slice().reverse().map(notification => {
            const template = document.getElementById('notificationTemplate').content.cloneNode(true);
            const notificationElement = template.querySelector('.notification-item');
            
            notificationElement.querySelector('.notification-title').textContent = notification.title;
            notificationElement.querySelector('.notification-message').textContent = notification.message;
            notificationElement.querySelector('.notification-time').textContent = formatDate(notification.timestamp);
            
            return notificationElement.outerHTML;
        }).join('');
    }
    
    document.getElementById('notificationsModal').classList.add('active');
}

function closeModal() {
    document.getElementById('notificationsModal').classList.remove('active');
}

// Toast notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Demo utilities for development
function addSampleData() {
    // Create sample users
    const user1 = {
        id: 'user1',
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123',
        messages: [],
        notifications: []
    };
    
    const user2 = {
        id: 'user2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        messages: [],
        notifications: []
    };

    db.users.push(user1, user2);

    // Create sample cards
    const card1 = {
        id: 'card1',
        userId: 'user1',
        pan: generatePAN(),
        exp: generateExpiry(),
        cvv: generateCVV(),
        holderName: 'John Smith',
        balance: 1500.00,
        frozen: false
    };

    const card2 = {
        id: 'card2',
        userId: 'user2',
        pan: generatePAN(),
        exp: generateExpiry(),
        cvv: generateCVV(),
        holderName: 'Jane Doe',
        balance: 2300.00,
        frozen: false
    };

    db.cards.push(card1, card2);
    
    saveDB();
    console.log('Sample data added for testing');
}

// Uncomment the line below to add sample data for testing
// addSampleData();