// Delicious Waffle Co - Mobile Responsive with Supabase Integration
// Application State
let currentCustomer = null;
let isStaffView = true;
let supabase = null;
let isOnline = false;
let connectionRetryCount = 0;
const MAX_RETRIES = 3;

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeSupabase();
    loadSampleData();
    setupEventListeners();
    updateConnectionStatus();
});

// Initialize the application
function initializeApp() {
    // Initialize localStorage if empty
    if (!localStorage.getItem('waffleCustomers')) {
        localStorage.setItem('waffleCustomers', JSON.stringify({}));
    }
    
    // Ensure modal and containers are hidden on load
    const modal = document.getElementById('rewardModal');
    const messageContainer = document.getElementById('messageContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    
    if (messageContainer) {
        messageContainer.classList.add('hidden');
    }
    
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
    
    // Set initial view
    updateViewDisplay();
    
    // Mobile viewport optimization
    setupMobileOptimizations();
}

// Mobile optimizations
function setupMobileOptimizations() {
    // Prevent zoom on input focus for iOS
    const inputs = document.querySelectorAll('input[type="tel"], input[type="text"], input[type="email"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth < 768) {
                this.style.fontSize = '16px';
            }
        });
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    });
    
    // Touch feedback for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Initialize Supabase
async function initializeSupabase() {
    try {
        // Check if we have valid Supabase credentials
        if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
            console.log('Supabase not configured, using localStorage only');
            updateConnectionStatus(false, 'Using offline mode');
            return;
        }
        
        // Initialize Supabase client
        supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        // Test connection
        const { data, error } = await supabase.from('customers').select('count').limit(1);
        
        if (error) {
            throw error;
        }
        
        isOnline = true;
        updateConnectionStatus(true, 'Connected to cloud');
        
        // Sync local data to cloud if needed
        await syncLocalToCloud();
        
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        isOnline = false;
        updateConnectionStatus(false, 'Offline mode');
        
        // Retry connection after delay
        if (connectionRetryCount < MAX_RETRIES) {
            connectionRetryCount++;
            setTimeout(() => {
                initializeSupabase();
            }, 5000 * connectionRetryCount);
        }
    }
}

// Update connection status indicator
function updateConnectionStatus(online = false, message = '') {
    const statusElement = document.getElementById('connectionStatus');
    const iconElement = document.getElementById('connectionIcon');
    const textElement = document.getElementById('connectionText');
    
    if (!statusElement || !iconElement || !textElement) return;
    
    if (online) {
        iconElement.textContent = '🌐';
        textElement.textContent = message || 'Connected';
        statusElement.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        
        // Hide after 3 seconds if connected
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    } else {
        iconElement.textContent = '📱';
        textElement.textContent = message || 'Offline Mode';
        statusElement.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
    
    statusElement.classList.add('show');
}

// Sync local data to cloud
async function syncLocalToCloud() {
    if (!supabase || !isOnline) return;
    
    try {
        const localCustomers = getCustomersFromStorage();
        
        for (const [phone, customer] of Object.entries(localCustomers)) {
            // Check if customer exists in cloud
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', phone)
                .single();
            
            if (!existingCustomer) {
                // Upload to cloud
                await supabase.from('customers').insert([customer]);
            }
        }
        
        console.log('Local data synced to cloud');
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

// Load sample data with proper hasActiveCard tracking
function loadSampleData() {
    const customers = getCustomersFromStorage();
    
    // If no customers exist, load sample data
    if (Object.keys(customers).length === 0) {
        const sampleData = {
            "9876543210": {
                phone: "9876543210",
                name: "Rahul Kumar",
                email: "rahul@example.com",
                punches: 8,
                hasActiveCard: true,
                totalVisits: 18,
                rewardsRedeemed: 1,
                memberSince: "2024-01-15",
                lastRedemption: "2024-08-15",
                visitHistory: [
                    {date: "2024-09-30", punches: 1},
                    {date: "2024-09-25", punches: 1},
                    {date: "2024-09-20", punches: 1},
                    {date: "2024-09-15", punches: 1},
                    {date: "2024-09-10", punches: 1},
                    {date: "2024-09-05", punches: 1},
                    {date: "2024-08-30", punches: 1},
                    {date: "2024-08-25", punches: 1}
                ]
            },
            "8765432109": {
                phone: "8765432109",
                name: "Priya Sharma",
                email: "priya@example.com",
                punches: 3,
                hasActiveCard: true,
                totalVisits: 8,
                rewardsRedeemed: 0,
                memberSince: "2024-02-10",
                visitHistory: [
                    {date: "2024-09-28", punches: 1},
                    {date: "2024-09-22", punches: 1},
                    {date: "2024-09-15", punches: 1}
                ]
            },
            "7654321098": {
                phone: "7654321098",
                name: "Amit Singh",
                email: "amit@example.com",
                punches: 10,
                hasActiveCard: true,
                totalVisits: 22,
                rewardsRedeemed: 2,
                memberSince: "2024-03-05",
                visitHistory: [
                    {date: "2024-09-30", punches: 1},
                    {date: "2024-09-28", punches: 1},
                    {date: "2024-09-26", punches: 1},
                    {date: "2024-09-24", punches: 1},
                    {date: "2024-09-22", punches: 1},
                    {date: "2024-09-20", punches: 1},
                    {date: "2024-09-18", punches: 1},
                    {date: "2024-09-16", punches: 1},
                    {date: "2024-09-14", punches: 1},
                    {date: "2024-09-12", punches: 1}
                ]
            },
            "6543210987": {
                phone: "6543210987",
                name: "Sneha Patel",
                email: "sneha@example.com",
                punches: 0,
                hasActiveCard: false,
                totalVisits: 12,
                rewardsRedeemed: 1,
                memberSince: "2024-04-20",
                lastRedemption: "2024-09-25",
                visitHistory: [
                    {date: "2024-09-25", punches: 1, redeemed: true}
                ]
            }
        };
        
        localStorage.setItem('waffleCustomers', JSON.stringify(sampleData));
    }
}

// Setup all event listeners with mobile optimizations
function setupEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('click', toggleView);
        
        // Touch feedback
        viewToggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
        });
        
        viewToggle.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = '';
            setTimeout(() => toggleView(), 100);
        });
    }
    
    // Staff interface
    const searchBtn = document.getElementById('searchCustomer');
    const showRegBtn = document.getElementById('showRegisterForm');
    const cancelRegBtn = document.getElementById('cancelRegister');
    const customerForm = document.getElementById('customerForm');
    
    if (searchBtn) searchBtn.addEventListener('click', searchCustomer);
    if (showRegBtn) showRegBtn.addEventListener('click', showRegistrationForm);
    if (cancelRegBtn) cancelRegBtn.addEventListener('click', hideRegistrationForm);
    if (customerForm) customerForm.addEventListener('submit', registerCustomer);
    
    // Customer interface
    const viewCardBtn = document.getElementById('viewMyCard');
    if (viewCardBtn) viewCardBtn.addEventListener('click', viewCustomerCard);
    
    // Modal events with mobile optimizations
    const confirmBtn = document.getElementById('confirmRedeem');
    const cancelBtn = document.getElementById('cancelRedeem');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmRedemption();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeRewardModal();
        });
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeRewardModal();
        });
    }
    
    // Message close
    const closeMessageBtn = document.getElementById('closeMessage');
    if (closeMessageBtn) {
        closeMessageBtn.addEventListener('click', hideMessage);
    }
    
    // Phone number formatting with mobile optimizations
    const phoneInputs = ['phoneSearch', 'customerPhone', 'customerPhoneSearch'];
    phoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', formatPhoneNumber);
            
            // Mobile keyboard optimization
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('pattern', '[0-9]*');
        }
    });
    
    // Enter key support
    const phoneSearch = document.getElementById('phoneSearch');
    const customerPhoneSearch = document.getElementById('customerPhoneSearch');
    
    if (phoneSearch) {
        phoneSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchCustomer();
            }
        });
    }
    
    if (customerPhoneSearch) {
        customerPhoneSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                viewCustomerCard();
            }
        });
    }
    
    // Modal backdrop click to close
    const modal = document.getElementById('rewardModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeRewardModal();
            }
        });
    }
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeRewardModal();
            hideMessage();
        }
    });
    
    // Connection status click to retry
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
        connectionStatus.addEventListener('click', function() {
            if (!isOnline) {
                connectionRetryCount = 0;
                updateConnectionStatus(false, 'Reconnecting...');
                initializeSupabase();
            }
        });
    }
}

// Toggle between staff and customer views
function toggleView() {
    isStaffView = !isStaffView;
    updateViewDisplay();
    clearDisplays();
    closeRewardModal();
    
    // Haptic feedback on mobile
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Update view display
function updateViewDisplay() {
    const staffInterface = document.getElementById('staffInterface');
    const customerInterface = document.getElementById('customerInterface');
    const viewToggle = document.getElementById('viewToggle');
    
    if (isStaffView) {
        if (staffInterface) staffInterface.classList.remove('hidden');
        if (customerInterface) customerInterface.classList.add('hidden');
        if (viewToggle) viewToggle.innerHTML = '<span class="btn-text">👤 Customer View</span>';
    } else {
        if (staffInterface) staffInterface.classList.add('hidden');
        if (customerInterface) customerInterface.classList.remove('hidden');
        if (viewToggle) viewToggle.innerHTML = '<span class="btn-text">👨‍💼 Staff View</span>';
    }
}

// Format phone number input with mobile optimization
function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    e.target.value = value;
    
    // Mobile haptic feedback
    if (navigator.vibrate && value.length === 10) {
        navigator.vibrate(30);
    }
}

// Validate phone number
function isValidPhoneNumber(phone) {
    return /^\d{10}$/.test(phone);
}

// Get customers from storage (localStorage or Supabase)
function getCustomersFromStorage() {
    return JSON.parse(localStorage.getItem('waffleCustomers') || '{}');
}

// Save customers to storage (both localStorage and Supabase)
async function saveCustomersToStorage(customers) {
    // Always save to localStorage first
    localStorage.setItem('waffleCustomers', JSON.stringify(customers));
    
    // Try to save to Supabase if online
    if (supabase && isOnline) {
        try {
            // We'll implement individual customer updates in the specific functions
            console.log('Data saved locally and will sync to cloud');
        } catch (error) {
            console.error('Failed to sync to cloud:', error);
            // Still continue with local storage
        }
    }
}

// Save customer to Supabase
async function saveCustomerToSupabase(customer) {
    if (!supabase || !isOnline) return false;
    
    try {
        const { data, error } = await supabase
            .from('customers')
            .upsert([customer], { onConflict: 'phone' });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to save to Supabase:', error);
        return false;
    }
}

// Search for customer with Supabase integration
async function searchCustomer() {
    const phoneInput = document.getElementById('phoneSearch');
    if (!phoneInput) return;
    
    const phone = phoneInput.value.trim();
    
    if (!isValidPhoneNumber(phone)) {
        showMessage('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    showLoading();
    
    try {
        let customer = null;
        
        // Try Supabase first if online
        if (supabase && isOnline) {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', phone)
                .single();
            
            if (!error && data) {
                customer = data;
                // Update local storage
                const customers = getCustomersFromStorage();
                customers[phone] = customer;
                localStorage.setItem('waffleCustomers', JSON.stringify(customers));
            }
        }
        
        // Fallback to local storage
        if (!customer) {
            const customers = getCustomersFromStorage();
            customer = customers[phone];
        }
        
        hideLoading();
        
        if (customer) {
            currentCustomer = customer;
            displayCustomer(customer);
            hideRegistrationForm();
        } else {
            showMessage('Customer not found. Please register them first.', 'error');
            const customerPhoneInput = document.getElementById('customerPhone');
            if (customerPhoneInput) {
                customerPhoneInput.value = phone;
            }
            showRegistrationForm();
        }
    } catch (error) {
        hideLoading();
        console.error('Search failed:', error);
        showMessage('Search failed. Please try again.', 'error');
    }
}

// Display customer information with delicious animations
function displayCustomer(customer) {
    const container = document.getElementById('customerFound');
    if (!container) return;
    
    // Calculate current punch card status
    const currentPunches = customer.hasActiveCard ? customer.punches % 10 : 0;
    const punchesNeeded = Math.max(0, 10 - currentPunches);
    const progressPercentage = (currentPunches / 10) * 100;
    
    // Check if customer can redeem (has 10 punches on active card)
    const canRedeem = customer.hasActiveCard && currentPunches === 0 && customer.punches >= 10;
    
    container.innerHTML = `
        <div class="customer-header">
            <div class="customer-info">
                <h3>🧇 ${customer.name}</h3>
                <p><strong>📱 Phone:</strong> ${customer.phone}</p>
                <p><strong>📅 Member Since:</strong> ${formatDate(customer.memberSince)}</p>
                ${customer.lastRedemption ? `<p><strong>🎁 Last Reward:</strong> ${formatDate(customer.lastRedemption)}</p>` : ''}
            </div>
            
            <div class="customer-details">
                <div class="detail-item">
                    <span class="detail-value">${customer.totalVisits}</span>
                    <span class="detail-label">Total Visits</span>
                </div>
                <div class="detail-item">
                    <span class="detail-value">${customer.rewardsRedeemed}</span>
                    <span class="detail-label">Free Waffles Earned</span>
                </div>
                <div class="detail-item">
                    <span class="detail-value">${currentPunches}/10</span>
                    <span class="detail-label">Current Card</span>
                </div>
            </div>
        </div>
        
        <div class="punch-card">
            <h4 class="punch-card-title">🧇 Loyalty Punch Card</h4>
            
            <div class="punch-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <p class="progress-text">
                    ${canRedeem ? 
                        '🎉 REWARD READY! Customer can redeem free waffle!' : 
                        customer.hasActiveCard ? 
                            `${punchesNeeded} more visits needed for free waffle` :
                            'New punch card - Add first punch to get started!'
                    }
                </p>
            </div>
            
            <div class="punch-grid">
                ${generatePunchSlots(currentPunches)}
            </div>
            
            <div class="customer-actions mobile-stack">
                <button class="btn btn--add-punch touch-friendly butter-hover" onclick="addPunch('${customer.phone}')">
                    <span class="btn-text">🧇 Add Punch</span>
                </button>
                ${canRedeem ? 
                    '<button class="btn btn--redeem touch-friendly butter-hover" onclick="showRewardModal()"><span class="btn-text">🎁 REDEEM FREE WAFFLE!</span></button>' :
                    '<button class="btn btn--outline touch-friendly butter-hover" onclick="viewHistory()"><span class="btn-text">📋 View History</span></button>'
                }
            </div>
        </div>
        
        <div id="historySection" class="visit-history hidden">
            <div class="card delicious-card">
                <div class="card__body">
                    <h4>📋 Visit History</h4>
                    <div class="history-list">
                        ${customer.visitHistory ? customer.visitHistory.slice(0, 10).map(visit => `
                            <div class="history-item">
                                <span class="history-date">${formatDate(visit.date)}</span>
                                <span class="history-punches">${visit.redeemed ? '🎁 Redeemed' : '+' + visit.punches + ' 🧇'}</span>
                            </div>
                        `).join('') : '<div class="history-item"><span>No visit history available</span></div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.classList.remove('hidden');
    
    // Animate punch slots
    setTimeout(() => {
        const punchSlots = container.querySelectorAll('.punch-slot.filled');
        punchSlots.forEach((slot, index) => {
            setTimeout(() => {
                slot.style.animation = 'satisfying-punch 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, index * 100);
        });
    }, 300);
}

// Generate punch slots HTML with waffle icons
function generatePunchSlots(punches) {
    let slots = '';
    for (let i = 0; i < 10; i++) {
        const filled = i < punches ? 'filled' : '';
        slots += `<div class="punch-slot ${filled}"></div>`;
    }
    return slots;
}

// Show registration form with mobile optimization
function showRegistrationForm() {
    const form = document.getElementById('registrationForm');
    const nameInput = document.getElementById('customerName');
    
    if (form) {
        form.classList.remove('hidden');
        
        // Scroll to form on mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
    
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 200);
    }
}

// Hide registration form
function hideRegistrationForm() {
    const form = document.getElementById('registrationForm');
    const customerForm = document.getElementById('customerForm');
    
    if (form) form.classList.add('hidden');
    if (customerForm) customerForm.reset();
}

// Register new customer with Supabase integration
async function registerCustomer(e) {
    e.preventDefault();
    
    const phoneInput = document.getElementById('customerPhone');
    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    
    if (!phoneInput || !nameInput) return;
    
    const phone = phoneInput.value.trim();
    const name = nameInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!isValidPhoneNumber(phone)) {
        showMessage('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    if (!name) {
        showMessage('Please enter customer name', 'error');
        return;
    }
    
    // Check if customer already exists
    const customers = getCustomersFromStorage();
    if (customers[phone]) {
        showMessage('Customer with this phone number already exists', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Create new customer with proper structure
        const newCustomer = {
            phone: phone,
            name: name,
            email: email,
            punches: 1,
            hasActiveCard: true,
            totalVisits: 1,
            rewardsRedeemed: 0,
            memberSince: getCurrentDate(),
            visitHistory: [
                {date: getCurrentDate(), punches: 1}
            ]
        };
        
        // Save to local storage
        customers[phone] = newCustomer;
        await saveCustomersToStorage(customers);
        
        // Try to save to Supabase
        const supabaseSuccess = await saveCustomerToSupabase(newCustomer);
        
        // Display the new customer
        currentCustomer = newCustomer;
        displayCustomer(newCustomer);
        hideRegistrationForm();
        hideLoading();
        
        const message = supabaseSuccess ? 
            `Delicious! Welcome ${name}! First punch added! 🧇` :
            `Welcome ${name}! First punch added! 🧇 (Saved locally)`;
        
        showMessage(message, 'success');
        
        // Clear the phone search field
        const phoneSearch = document.getElementById('phoneSearch');
        if (phoneSearch) phoneSearch.value = '';
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
    } catch (error) {
        hideLoading();
        console.error('Registration failed:', error);
        showMessage('Registration failed. Please try again.', 'error');
    }
}

// Add punch to customer with delicious animations and Supabase sync
async function addPunch(phone) {
    showLoading();
    
    try {
        const customers = getCustomersFromStorage();
        const customer = customers[phone];
        
        if (!customer) {
            hideLoading();
            showMessage('Customer not found', 'error');
            return;
        }
        
        // If customer doesn't have an active card, start a new one
        if (!customer.hasActiveCard) {
            customer.hasActiveCard = true;
            customer.punches = 1;
        } else {
            customer.punches += 1;
        }
        
        customer.totalVisits += 1;
        
        // Add to visit history
        if (!customer.visitHistory) {
            customer.visitHistory = [];
        }
        customer.visitHistory.unshift({
            date: getCurrentDate(),
            punches: 1
        });
        
        // Save changes
        await saveCustomersToStorage(customers);
        
        // Try to sync to Supabase
        const supabaseSuccess = await saveCustomerToSupabase(customer);
        
        currentCustomer = customer;
        
        // Check if customer just completed a punch card (reached 10)
        const currentPunches = customer.punches % 10;
        if (currentPunches === 0 && customer.punches >= 10) {
            // Customer completed a punch card - show reward modal with celebration
            hideLoading();
            
            // Haptic celebration
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 300]);
            }
            
            showRewardModal();
        } else {
            // Regular punch added
            displayCustomer(customer);
            hideLoading();
            
            const message = supabaseSuccess ?
                'Delicious! Punch Added! 🧇' :
                'Punch Added! 🧇 (Saved locally)';
            
            showMessage(message, 'success');
            
            // Gentle haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }
    } catch (error) {
        hideLoading();
        console.error('Add punch failed:', error);
        showMessage('Failed to add punch. Please try again.', 'error');
    }
}

// View customer card (customer interface) with Supabase integration
async function viewCustomerCard() {
    const phoneInput = document.getElementById('customerPhoneSearch');
    if (!phoneInput) return;
    
    const phone = phoneInput.value.trim();
    
    if (!isValidPhoneNumber(phone)) {
        showMessage('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    showLoading();
    
    try {
        let customer = null;
        
        // Try Supabase first if online
        if (supabase && isOnline) {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', phone)
                .single();
            
            if (!error && data) {
                customer = data;
                // Update local storage
                const customers = getCustomersFromStorage();
                customers[phone] = customer;
                localStorage.setItem('waffleCustomers', JSON.stringify(customers));
            }
        }
        
        // Fallback to local storage
        if (!customer) {
            const customers = getCustomersFromStorage();
            customer = customers[phone];
        }
        
        hideLoading();
        
        if (customer) {
            displayCustomerCard(customer);
        } else {
            showMessage('No punch card found for this number', 'error');
            const cardDisplay = document.getElementById('customerCardDisplay');
            if (cardDisplay) cardDisplay.classList.add('hidden');
        }
    } catch (error) {
        hideLoading();
        console.error('View card failed:', error);
        showMessage('Failed to load punch card. Please try again.', 'error');
    }
}

// Display customer card (customer view) with delicious styling
function displayCustomerCard(customer) {
    const container = document.getElementById('customerCardDisplay');
    if (!container) return;
    
    const currentPunches = customer.hasActiveCard ? customer.punches % 10 : 0;
    const progressPercentage = (currentPunches / 10) * 100;
    const punchesNeeded = Math.max(0, 10 - currentPunches);
    const canRedeem = customer.hasActiveCard && currentPunches === 0 && customer.punches >= 10;
    
    container.innerHTML = `
        <div class="card delicious-card">
            <div class="card__body">
                <div class="customer-header">
                    <div class="customer-info">
                        <h3>Welcome, ${customer.name}! 🧇</h3>
                        <p><strong>📅 Member Since:</strong> ${formatDate(customer.memberSince)}</p>
                        ${customer.lastRedemption ? `<p><strong>🎁 Last Reward:</strong> ${formatDate(customer.lastRedemption)}</p>` : ''}
                    </div>
                    
                    <div class="customer-details">
                        <div class="detail-item">
                            <span class="detail-value">${customer.totalVisits}</span>
                            <span class="detail-label">Total Visits</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-value">${customer.rewardsRedeemed}</span>
                            <span class="detail-label">Free Waffles Earned</span>
                        </div>
                    </div>
                </div>
                
                <div class="punch-card">
                    <h4 class="punch-card-title">🧇 Your Punch Card</h4>
                    
                    <div class="punch-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <p class="progress-text">
                            ${canRedeem ? 
                                '🎉 You have earned a free waffle! Show this to staff.' : 
                                customer.hasActiveCard ?
                                    `${punchesNeeded} more visits for your free waffle!` :
                                    'Visit us to start earning your free waffle!'
                            }
                        </p>
                    </div>
                    
                    <div class="punch-grid">
                        ${generatePunchSlots(currentPunches)}
                    </div>
                </div>
                
                <div class="visit-history">
                    <h4>📋 Recent Visits</h4>
                    <div class="history-list">
                        ${customer.visitHistory ? customer.visitHistory.slice(0, 5).map(visit => `
                            <div class="history-item">
                                <span class="history-date">${formatDate(visit.date)}</span>
                                <span class="history-punches">${visit.redeemed ? '🎁 Redeemed' : '+' + visit.punches + ' 🧇'}</span>
                            </div>
                        `).join('') : '<div class="history-item"><span>No visit history available</span></div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.classList.remove('hidden');
    
    // Animate punch slots
    setTimeout(() => {
        const punchSlots = container.querySelectorAll('.punch-slot.filled');
        punchSlots.forEach((slot, index) => {
            setTimeout(() => {
                slot.style.animation = 'satisfying-punch 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, index * 100);
        });
    }, 300);
}

// Show reward modal with delicious celebration
function showRewardModal() {
    const modal = document.getElementById('rewardModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // Focus on the redeem button for accessibility
        setTimeout(() => {
            const redeemBtn = document.getElementById('confirmRedeem');
            if (redeemBtn) redeemBtn.focus();
        }, 100);
        
        // Prevent body scroll on mobile
        document.body.style.overflow = 'hidden';
    }
}

// Close reward modal
function closeRewardModal() {
    const modal = document.getElementById('rewardModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Refresh the customer display if we have a current customer
        if (currentCustomer) {
            if (isStaffView) {
                displayCustomer(currentCustomer);
            } else {
                displayCustomerCard(currentCustomer);
            }
        }
    }
}

// Confirm reward redemption with Supabase sync
async function confirmRedemption() {
    if (!currentCustomer) {
        closeRewardModal();
        return;
    }
    
    showLoading();
    closeRewardModal();
    
    try {
        const customers = getCustomersFromStorage();
        const customer = customers[currentCustomer.phone];
        
        if (customer && customer.hasActiveCard && customer.punches >= 10) {
            // Reset punch card properly
            customer.punches = 0;
            customer.hasActiveCard = false;
            customer.rewardsRedeemed += 1;
            customer.lastRedemption = getCurrentDate();
            
            // Add redemption to history
            if (!customer.visitHistory) {
                customer.visitHistory = [];
            }
            customer.visitHistory.unshift({
                date: getCurrentDate(),
                punches: 0,
                redeemed: true
            });
            
            await saveCustomersToStorage(customers);
            
            // Try to sync to Supabase
            const supabaseSuccess = await saveCustomerToSupabase(customer);
            
            currentCustomer = customer;
            
            if (isStaffView) {
                displayCustomer(customer);
            } else {
                displayCustomerCard(customer);
            }
            
            hideLoading();
            
            const message = supabaseSuccess ?
                'Delicious! Free waffle redeemed! 🧇🎉 New punch card started!' :
                'Free waffle redeemed! 🧇🎉 New punch card started! (Saved locally)';
            
            showMessage(message, 'success');
            
            // Celebration haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 500]);
            }
        } else {
            hideLoading();
            showMessage('Error processing redemption', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Redemption failed:', error);
        showMessage('Redemption failed. Please try again.', 'error');
    }
}

// View customer history
function viewHistory() {
    const historySection = document.getElementById('historySection');
    if (historySection) {
        historySection.classList.toggle('hidden');
        
        // Scroll to history on mobile
        if (!historySection.classList.contains('hidden') && window.innerWidth <= 768) {
            setTimeout(() => {
                historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
}

// Utility functions
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showMessage(text, type = 'success') {
    const container = document.getElementById('messageContainer');
    const messageText = document.getElementById('messageText');
    
    if (container && messageText) {
        messageText.textContent = text;
        container.classList.remove('hidden', 'message-success', 'message-error');
        container.classList.add(`message-${type}`);
        
        // Add golden glow for success messages
        if (type === 'success') {
            container.classList.add('golden-glow');
        }
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideMessage();
        }, 5000);
        
        // Gentle haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(type === 'success' ? 50 : 100);
        }
    }
}

function hideMessage() {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.classList.add('hidden');
        container.classList.remove('golden-glow');
    }
}

function showLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.classList.remove('hidden');
        
        // Prevent body scroll on mobile
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.classList.add('hidden');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

function clearDisplays() {
    const customerFound = document.getElementById('customerFound');
    const customerCardDisplay = document.getElementById('customerCardDisplay');
    const phoneSearch = document.getElementById('phoneSearch');
    const customerPhoneSearch = document.getElementById('customerPhoneSearch');
    
    if (customerFound) customerFound.classList.add('hidden');
    if (customerCardDisplay) customerCardDisplay.classList.add('hidden');
    if (phoneSearch) phoneSearch.value = '';
    if (customerPhoneSearch) customerPhoneSearch.value = '';
    
    hideRegistrationForm();
    closeRewardModal();
    currentCustomer = null;
}

// Service Worker Registration for Offline Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Simple service worker for caching static assets
        const swCode = `
            const CACHE_NAME = 'waffle-co-v1';
            const urlsToCache = [
                '/',
                '/style.css',
                '/app.js',
                'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap'
            ];
            
            self.addEventListener('install', function(event) {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            return cache.addAll(urlsToCache);
                        })
                );
            });
            
            self.addEventListener('fetch', function(event) {
                event.respondWith(
                    caches.match(event.request)
                        .then(function(response) {
                            if (response) {
                                return response;
                            }
                            return fetch(event.request);
                        }
                    )
                );
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl)
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}