// Check if user is logged in
function checkAuth() {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
    }
}

let cart = [];
let menuItems = [];
let currentItem = null;
let orderUpdateInterval = null;

let currentCustomization = {
    item: null,
    quantity: 1,
    modifiers: {},
    addons: [],
    basePrice: 0,
    total: 0
};

// Fetch menu items when the page loads
async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch menu items');
        }
        menuItems = await response.json();
        displayMenuItems();
    } catch (error) {
        console.error('Error fetching menu items:', error);
        alert('Error loading menu items. Please try again.');
    }
}

// Display menu items with customize button
function displayMenuItems() {
    const menuContainer = document.getElementById('menu-items');
    
    // Group items by category
    const itemsByCategory = menuItems.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    // Sort categories alphabetically
    const sortedCategories = Object.keys(itemsByCategory).sort();

    // Generate HTML for each category
    menuContainer.innerHTML = sortedCategories
        .map(category => {
            // Sort items within category by name
            const sortedItems = itemsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
            
            return `
                <div class="menu-category">
                    <h2 class="category-title">${category}</h2>
                    <div class="menu-items-grid">
                        ${sortedItems.map(item => `
                            <div class="menu-item">
                                <h3>${item.name}</h3>
                                <p>${item.description || ''}</p>
                                <p class="price">$${item.price}</p>
                                <button class="add-btn" onclick="showCustomizeModal(${item.id})">Customize & Add</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
}

// Show customize modal
function showCustomizeModal(itemId) {
    const item = menuItems.find(menuItem => menuItem.id === itemId);
    if (!item) return;

    currentCustomization = {
        item: item,
        quantity: 1,
        modifiers: {},
        addons: [],
        basePrice: parseFloat(item.price),
        total: parseFloat(item.price)
    };

    // Display item details
    document.getElementById('item-details').innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.description || ''}</p>
        <p class="price">Base Price: $${item.price}</p>
    `;

    // Display modifiers
    const modifiersContainer = document.getElementById('modifiers-container');
    modifiersContainer.innerHTML = '';

    if (item.modifiers) {
        Object.entries(item.modifiers).forEach(([key, modifier]) => {
            if (modifier.available) {
                const modifierGroup = document.createElement('div');
                modifierGroup.className = 'modifier-group';
                modifierGroup.innerHTML = `
                    <label>${key.charAt(0).toUpperCase() + key.slice(1)} Level:</label>
                    <select id="${key}-level" onchange="updateModifier('${key}', this.value)">
                        ${modifier.options.map(option => 
                            `<option value="${option}">${option}</option>`
                        ).join('')}
                    </select>
                `;
                modifiersContainer.appendChild(modifierGroup);
                currentCustomization.modifiers[key] = modifier.options[0];
            }
        });
    }

    // Display add-ons
    const addonsContainer = document.getElementById('addons-container');
    addonsContainer.innerHTML = '';

    if (item.addOns && item.addOns.length > 0) {
        item.addOns.forEach(addon => {
            if (addon.available) {
                const addonDiv = document.createElement('div');
                addonDiv.className = 'addon-item';
                addonDiv.innerHTML = `
                    <label>
                        <input type="checkbox" 
                               name="addon" 
                               value="${addon.name}"
                               data-price="${addon.price}"
                               onchange="updateAddons(this)">
                        ${addon.name} (+$${addon.price.toFixed(2)})
                    </label>
                `;
                addonsContainer.appendChild(addonDiv);
            }
        });
    } else {
        addonsContainer.innerHTML = '<p>No add-ons available</p>';
    }

    // Reset quantity
    document.getElementById('modal-quantity').textContent = '1';

    // Update total
    updateModalTotal();

    // Show modal
    document.getElementById('customize-modal').classList.add('show');
}

// Close customize modal
function closeCustomizeModal() {
    document.getElementById('customize-modal').classList.remove('show');
    currentCustomization = null;
}

// Update modifier selection
function updateModifier(type, value) {
    currentCustomization.modifiers[type] = value;
    updateModalTotal();
}

// Update add-ons selection
function updateAddons(checkbox) {
    const addon = {
        name: checkbox.value,
        price: parseFloat(checkbox.dataset.price)
    };

    if (checkbox.checked) {
        currentCustomization.addons.push(addon);
    } else {
        currentCustomization.addons = currentCustomization.addons.filter(
            item => item.name !== addon.name
        );
    }

    updateModalTotal();
}

// Update quantity
function updateQuantity(change) {
    const quantityElement = document.getElementById('modal-quantity');
    let newQuantity = parseInt(quantityElement.textContent) + change;
    
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 99) newQuantity = 99;
    
    quantityElement.textContent = newQuantity;
    currentCustomization.quantity = newQuantity;
    
    updateModalTotal();
}

// Update modal total
function updateModalTotal() {
    let total = currentCustomization.basePrice;
    
    // Add add-ons prices
    total += currentCustomization.addons.reduce((sum, addon) => sum + addon.price, 0);
    
    // Multiply by quantity
    total *= currentCustomization.quantity;
    
    // Update display
    document.getElementById('modal-total').textContent = total.toFixed(2);
    currentCustomization.total = total;
}

// Add customized item to cart
function addToCart() {
    const item = currentCustomization.item;
    
    const cartItem = {
        menuItemId: item.id,
        name: item.name,
        price: currentCustomization.basePrice,
        quantity: currentCustomization.quantity,
        modifiers: currentCustomization.modifiers,
        addons: currentCustomization.addons,
        total: currentCustomization.total
    };
    
    cart.push(cartItem);
    updateCartDisplay();
    closeCustomizeModal();
}

// Update cart display to show modifiers and add-ons
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-details">
                <span>${item.name}</span>
                ${item.modifiers ? `
                    <small>
                        ${Object.entries(item.modifiers).map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join(', ')}
                    </small>
                ` : ''}
                ${item.addons && item.addons.length > 0 ? `
                    <small>Add-ons: ${item.addons.map(addon => addon.name).join(', ')}</small>
                ` : ''}
                <div class="quantity-controls">
                    <button onclick="event.stopPropagation(); updateQuantity(${index}, -1)" class="quantity-btn">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="event.stopPropagation(); updateQuantity(${index}, 1)" class="quantity-btn">+</button>
                </div>
            </div>
            <div class="cart-item-controls">
                <span>$${item.total.toFixed(2)}</span>
                <button onclick="event.stopPropagation(); removeFromCart(${index})" class="remove-btn">×</button>
            </div>
        </div>
    `).join('');

    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = cart.reduce((sum, item) => sum + item.total, 0).toFixed(2);
}

// Load user's orders for today
async function loadUserOrders() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
    }

    try {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const response = await fetch(`/api/orders/user?date=${today}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        const ordersContainer = document.getElementById('user-orders');
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p>No orders found</p>';
            return;
        }
        
        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <h3>Order #${order.id}</h3>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    ${order.status === 'delivered' && order.deliveryPhoto ? `
                        <div class="delivery-photo">
                            <p><strong>Delivery Confirmation Photo:</strong></p>
                            <img src="${order.deliveryPhoto}" alt="Delivery confirmation" style="max-width: 200px; border-radius: 4px; margin-top: 10px;">
                        </div>
                    ` : ''}
                </div>
                <div class="order-items">
                    <h4>Order Items:</h4>
                    <ul>
                        ${order.orderItems.map(item => {
                            // Calculate add-ons total
                            const addonsTotal = item.addons ? item.addons.reduce((sum, addon) => sum + addon.price, 0) : 0;
                            // Calculate item total including add-ons
                            const itemTotal = (item.price + addonsTotal) * item.quantity;
                            
                            return `
                                <li class="order-item-detail">
                                    <div class="item-name">${item.quantity}x ${item.name}</div>
                                    <div class="item-price">Base Price: $${item.price}</div>
                                    ${item.modifiers && Object.keys(item.modifiers).length > 0 ? `
                                        <div class="item-modifiers">
                                            <strong>Modifiers:</strong><br>
                                            ${Object.entries(item.modifiers)
                                                .map(([name, value]) => `
                                                    <span class="modifier-item">• ${name}: ${value}</span>
                                                `).join('<br>')}
                                        </div>
                                    ` : ''}
                                    ${item.addons && item.addons.length > 0 ? `
                                        <div class="item-addons">
                                            <strong>Add-ons:</strong><br>
                                            ${item.addons.map(addon => `
                                                <span class="addon-item">• ${addon.name} (+$${addon.price})</span>
                                            `).join('<br>')}
                                            <div class="addons-subtotal">Add-ons Subtotal: +$${(addonsTotal).toFixed(2)}</div>
                                        </div>
                                    ` : ''}
                                    <div class="item-subtotal">
                                        <div class="price-per-item">Price per item with add-ons: $${(item.price + addonsTotal).toFixed(2)}</div>
                                        <div class="total-price">Subtotal (${item.quantity} items): $${itemTotal.toFixed(2)}</div>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('user-orders').innerHTML = 
            '<p>Error loading orders. Please try again later.</p>';
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
        }
    }
}

// Show orders modal
document.getElementById('view-orders-btn').onclick = function() {
    document.getElementById('orders-modal').classList.add('show');
    loadUserOrders();
    // Start periodic updates
    startOrderUpdates();
};

// Close orders modal
function closeOrdersModal() {
    document.getElementById('orders-modal').classList.remove('show');
    // Stop periodic updates
    stopOrderUpdates();
}

// Start periodic order updates
function startOrderUpdates() {
    // Update orders every 30 seconds
    orderUpdateInterval = setInterval(loadUserOrders, 30000);
}

// Stop periodic order updates
function stopOrderUpdates() {
    if (orderUpdateInterval) {
        clearInterval(orderUpdateInterval);
        orderUpdateInterval = null;
    }
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

// Show checkout modal
document.getElementById('checkout-btn').onclick = async function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Display order summary in checkout modal
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.total).toFixed(2)}</span>
        </div>
    `).join('');
    
    checkoutTotal.textContent = cart.reduce((sum, item) => sum + item.total, 0).toFixed(2);
    
    // Show checkout modal
    document.getElementById('checkout-modal').classList.add('show');
};

// Close checkout modal
function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('show');
}

// Handle checkout form submission
document.getElementById('checkout-form').onsubmit = async function(e) {
    e.preventDefault();

    try {
        // Validate cart
        if (cart.length === 0) {
            throw new Error('Cart is empty');
        }

        const totalAmount = parseFloat(cart.reduce((sum, item) => sum + item.total, 0).toFixed(2));

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderItems: cart.map(item => ({
                    menuItemId: item.menuItemId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    modifiers: item.modifiers,
                    addons: item.addons,
                    total: item.total
                })),
                totalAmount
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to place order');
        }

        const order = await response.json();
        alert(`Order placed successfully! Order ID: ${order.id}`);
        cart = [];
        updateCartDisplay();
        closeCheckoutModal();
        
        // Show orders modal after successful order
        document.getElementById('orders-modal').classList.add('show');
        loadUserOrders();
        startOrderUpdates();
    } catch (error) {
        console.error('Error placing order:', error);
        alert(error.message || 'Failed to place order. Please try again.');
    }
};

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/login.html';
});

// Initialize
checkAuth();
loadMenuItems(); 