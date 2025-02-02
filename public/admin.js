// Check if user is admin
function checkAdminAuth() {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        window.location.href = '/login.html';
    }
}

// Handle tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        const tabId = `${button.dataset.tab}-tab`;
        document.getElementById(tabId).classList.add('active');
        
        // Load orders when switching to orders tab
        if (tabId === 'orders-tab') {
            loadOrders();
        }
    });
});

// Load orders
async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const orders = await response.json();
        const ordersList = document.getElementById('orders-list');
        
        if (!Array.isArray(orders)) {
            ordersList.innerHTML = '<p>No orders found</p>';
            return;
        }
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p>No orders available</p>';
            return;
        }
        
        ordersList.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <h3>Order #${order.id}</h3>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Email:</strong> ${order.customerEmail}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    ${order.deliveryPhoto ? `
                        <div class="delivery-photo">
                            <p><strong>Delivery Photo:</strong></p>
                            <img src="${order.deliveryPhoto}" alt="Delivery confirmation" style="max-width: 200px;">
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
                <div class="order-actions">
                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                        <button onclick="updateOrderStatus(${order.id}, '${
                            order.status === 'pending' ? 'processing' : 
                            order.status === 'processing' ? 'completed' : 
                            order.status === 'completed' ? 'delivered' : 'pending'
                        }')" class="status-btn">
                            ${order.status === 'pending' ? 'Mark Processing' : 
                              order.status === 'processing' ? 'Mark Completed' : 
                              order.status === 'completed' ? 'Mark Delivered' : 
                              'Reset to Pending'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = `<p>Error loading orders: ${error.message}</p>`;
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        // If marking as delivered, show photo upload modal
        if (newStatus === 'delivered') {
            showDeliveryPhotoModal(orderId);
            return;
        }

        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update order status');
        }

        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status: ' + error.message);
    }
}

// Show delivery photo upload modal
function showDeliveryPhotoModal(orderId) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Upload Delivery Photo</h2>
            <form id="delivery-photo-form">
                <div class="form-group">
                    <label for="delivery-photo">Delivery Photo:</label>
                    <input type="file" id="delivery-photo" accept="image/*" required>
                    <div id="photo-preview-container" style="margin-top: 10px; display: none;">
                        <p>Preview:</p>
                        <img id="photo-preview" src="" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 4px; margin-top: 5px;">
                    </div>
                </div>
                <button type="submit" class="primary-btn">Upload and Mark as Delivered</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    modal.querySelector('.close').onclick = () => {
        document.body.removeChild(modal);
    };

    // Add preview functionality
    const photoInput = modal.querySelector('#delivery-photo');
    const previewContainer = modal.querySelector('#photo-preview-container');
    const previewImg = modal.querySelector('#photo-preview');

    photoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.style.display = 'none';
            previewImg.src = '';
        }
    };

    // Handle form submission
    modal.querySelector('#delivery-photo-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const photoFile = document.getElementById('delivery-photo').files[0];
        
        if (!photoFile) {
            alert('Please select a photo');
            return;
        }

        formData.append('deliveryPhoto', photoFile);
        formData.append('status', 'delivered');

        try {
            const response = await fetch(`/api/admin/orders/${orderId}/delivery`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload delivery photo');
            }

            document.body.removeChild(modal);
            loadOrders();
        } catch (error) {
            console.error('Error uploading delivery photo:', error);
            alert('Failed to upload delivery photo: ' + error.message);
        }
    };
}

// Load menu items
async function loadMenuItems() {
    try {
        const response = await fetch('/api/admin/menu', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const menuItems = await response.json();
        const menuList = document.getElementById('menu-items-list');
        
        if (!Array.isArray(menuItems)) {
            menuList.innerHTML = '<p>No menu items found</p>';
            return;
        }
        
        if (menuItems.length === 0) {
            menuList.innerHTML = '<p>No menu items available</p>';
            return;
        }
        
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
        const menuList = document.getElementById('menu-items-list');
        menuList.innerHTML = `<p>Error loading menu items: ${error.message}</p>`;
    }
}

// Display menu items in admin panel
function displayMenuItems(items) {
    const menuList = document.getElementById('menu-items-list');
    
    // Group items by category
    const itemsByCategory = items.reduce((acc, item) => {
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
    menuList.innerHTML = sortedCategories
        .map(category => {
            // Sort items within category by name
            const sortedItems = itemsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
            
            return `
                <div class="menu-category">
                    <h2 class="category-title">${category}</h2>
                    <div class="menu-items-grid">
                        ${sortedItems.map(item => `
                            <div class="menu-item">
                                <div class="item-details">
                                    <h3>${item.name}</h3>
                                    <p>${item.description || ''}</p>
                                    <p class="price">$${item.price}</p>
                                    
                                    ${item.modifiers && Object.keys(item.modifiers).length > 0 ? `
                                        <div class="modifiers">
                                            ${Object.entries(item.modifiers)
                                                .filter(([_, data]) => data.available)
                                                .map(([name, data]) => `
                                                    <span class="modifier">${name}: ${data.options.join(', ')}</span>
                                                `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${item.addOns && item.addOns.length > 0 ? `
                                        <div class="addons">
                                            <strong>Add-ons:</strong>
                                            <ul>
                                                ${item.addOns.map(addon => `
                                                    <li>${addon.name} (+$${addon.price})${addon.available ? '' : ' (Unavailable)'}</li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="item-actions">
                                    <button onclick="editMenuItem(${item.id})" class="edit-btn">Edit</button>
                                    <button onclick="deleteMenuItem(${item.id})" class="delete-btn">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
}

// Modal functionality
const modal = document.getElementById('menu-modal');
const addButton = document.getElementById('add-menu-item-btn');
const closeButton = document.querySelector('.modal .close');
let currentItemId = null;

addButton.onclick = function() {
    currentItemId = null;
    document.getElementById('menu-form').reset();
    document.querySelector('.modal h2').textContent = 'Add Menu Item';
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    document.getElementById('menu-form').dataset.itemId = '';
    document.getElementById('menu-form').reset();
    modifiersList.innerHTML = '';
    addonsList.innerHTML = '';
}

// Initialize modal close handlers
closeButton.addEventListener('click', closeModal);
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

// Template handling
const modifierTemplate = document.querySelector('#modifier-template');
const modifiersList = document.querySelector('#modifiers-list');
const addonTemplate = document.querySelector('#addon-template');
const addonsList = document.querySelector('#addons-list');
const addAddonBtn = document.querySelector('#add-addon-btn');

// Add new modifier
function addNewModifier(name = '', options = []) {
    const clone = document.importNode(modifierTemplate.content, true);
    const modifierGroup = clone.querySelector('.modifier-group');
    
    // Set name if provided
    if (name) {
        modifierGroup.querySelector('.modifier-name').value = name;
    }

    // Add options if provided
    const optionChips = modifierGroup.querySelector('.option-chips');
    options.forEach(option => {
        addOptionChip(optionChips, option);
    });

    // Add event listeners
    const removeBtn = modifierGroup.querySelector('.remove-btn');
    removeBtn.addEventListener('click', function() {
        this.closest('.modifier-group').remove();
    });

    const addOptionBtn = modifierGroup.querySelector('.add-option-btn');
    const newOptionInput = modifierGroup.querySelector('.new-option-input');
    
    addOptionBtn.addEventListener('click', function() {
        const optionValue = newOptionInput.value.trim();
        if (optionValue) {
            addOptionChip(optionChips, optionValue);
            newOptionInput.value = '';
        }
    });

    newOptionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addOptionBtn.click();
        }
    });

    modifiersList.appendChild(modifierGroup);
}

// Add option chip
function addOptionChip(container, value) {
    const chip = document.createElement('div');
    chip.className = 'option-chip';
    chip.innerHTML = `
        ${value}
        <span class="remove-option" onclick="this.parentElement.remove()">×</span>
    `;
    container.appendChild(chip);
}

// Get form data including modifiers and add-ons
function getFormData() {
    const formData = {
        name: document.getElementById('item-name').value,
        description: document.getElementById('item-description').value,
        price: parseFloat(document.getElementById('item-price').value),
        category: document.getElementById('item-category').value,
        modifiers: {},
        addOns: []
    };

    // Collect modifiers
    document.querySelectorAll('.modifier-group').forEach(group => {
        const name = group.querySelector('.modifier-name').value.trim();
        if (name) {
            const options = Array.from(group.querySelectorAll('.option-chip'))
                .map(chip => chip.textContent.trim().replace('×', '').trim());
            
            formData.modifiers[name] = {
                available: options.length > 0,
                options: options
            };
        }
    });

    // Collect add-ons
    document.querySelectorAll('.addon-item').forEach(addon => {
        formData.addOns.push({
            name: addon.querySelector('.addon-name').value,
            price: parseFloat(addon.querySelector('.addon-price').value),
            available: addon.querySelector('.addon-available').checked
        });
    });

    return formData;
}

// Populate form with item data
function populateForm(item) {
    console.log('Populating form with item:', item);
    
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-description').value = item.description || '';
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category || '';

    // Clear existing modifiers and add-ons
    modifiersList.innerHTML = '';
    addonsList.innerHTML = '';

    // Add modifiers
    if (item.modifiers) {
        console.log('Setting up modifiers:', item.modifiers);
        Object.entries(item.modifiers).forEach(([name, data]) => {
            if (data.available) {
                addNewModifier(name, data.options);
            }
        });
    }

    // Add add-ons
    if (item.addOns && item.addOns.length > 0) {
        item.addOns.forEach(addon => {
            const clone = document.importNode(addonTemplate.content, true);
            clone.querySelector('.addon-name').value = addon.name;
            clone.querySelector('.addon-price').value = addon.price;
            clone.querySelector('.addon-available').checked = addon.available;
            addonsList.appendChild(clone);

            // Add remove button listener
            const removeBtn = addonsList.lastElementChild.querySelector('.remove-addon-btn');
            removeBtn.addEventListener('click', function() {
                this.closest('.addon-item').remove();
            });
        });
    }
}

// Handle form submission
document.getElementById('menu-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = getFormData();
    const itemId = this.dataset.itemId;
    
    // Log the form data being sent
    console.log('Submitting form data:', formData);
    console.log('Modifiers:', formData.modifiers);
    
    try {
        const response = await fetch(`/api/admin/menu${itemId ? `/${itemId}` : ''}`, {
            method: itemId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save menu item');
        }

        const savedItem = await response.json();
        console.log('Saved item:', savedItem);

        // Refresh menu items list and close modal
        await loadMenuItems();
        closeModal();
    } catch (error) {
        console.error('Error saving menu item:', error);
        alert('Error saving menu item: ' + error.message);
    }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/login.html';
});

// Run admin auth check when page loads
checkAdminAuth();
loadMenuItems();

// Edit menu item
async function editMenuItem(id) {
    try {
        const response = await fetch(`/api/admin/menu/${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to fetch menu item');
        }

        const item = await response.json();
        document.getElementById('menu-form').dataset.itemId = id;
        document.querySelector('.modal h2').textContent = 'Edit Menu Item';
        populateForm(item);
        modal.classList.add('show');
    } catch (error) {
        console.error('Error fetching menu item:', error);
        alert('Error loading menu item. Please try again.');
    }
}

// Delete menu item
window.deleteMenuItem = async function(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/menu/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        loadMenuItems();
    } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item: ' + error.message);
    }
}

// Add new add-on
function addNewAddon() {
    const clone = document.importNode(addonTemplate.content, true);
    addonsList.appendChild(clone);

    // Add event listener to remove button
    const removeBtn = addonsList.lastElementChild.querySelector('.remove-addon-btn');
    removeBtn.addEventListener('click', function() {
        this.closest('.addon-item').remove();
    });
}

// Initialize add-on button
if (addAddonBtn) {
    addAddonBtn.addEventListener('click', addNewAddon);
} 