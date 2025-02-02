let cart = [];
let menuItems = [];
let currentItem = null;

// Fetch menu items when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/menu');
        menuItems = await response.json();
        displayMenuItems();
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
});

// Display menu items
function displayMenuItems() {
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = menuItems.map(item => `
        <div class="menu-item" onclick="openCustomizationModal(${item.id})">
            <h3>${item.name}</h3>
            <p>${item.description || ''}</p>
            <p class="price">$${item.price}</p>
        </div>
    `).join('');
}

// Modal functionality
function openCustomizationModal(itemId) {
    currentItem = menuItems.find(item => item.id === itemId);
    const modal = document.getElementById('customization-modal');
    document.getElementById('modal-item-name').textContent = currentItem.name;
    document.getElementById('quantity').textContent = '1';
    modal.style.display = 'block';
}

// Close modal when clicking the X
document.querySelector('.close').onclick = function() {
    document.getElementById('customization-modal').style.display = 'none';
}

// Update quantity
function updateQuantity(change) {
    const quantityElement = document.getElementById('quantity');
    let quantity = parseInt(quantityElement.textContent) + change;
    if (quantity < 1) quantity = 1;
    quantityElement.textContent = quantity;
}

// Add to cart
document.getElementById('add-to-cart-btn').onclick = function() {
    if (!currentItem) return;

    const quantity = parseInt(document.getElementById('quantity').textContent);
    const cartItem = {
        id: currentItem.id,
        name: currentItem.name,
        price: currentItem.price,
        quantity: quantity,
        total: currentItem.price * quantity
    };

    cart.push(cartItem);
    updateCartDisplay();
    document.getElementById('customization-modal').style.display = 'none';
};

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.total).toFixed(2)}</span>
        </div>
    `).join('');

    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = cart.reduce((sum, item) => sum + item.total, 0).toFixed(2);
}

// Checkout functionality
document.getElementById('checkout-btn').onclick = async function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderItems: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity,
                    modifiers: [],
                    addOns: []
                })),
                totalAmount: cart.reduce((sum, item) => sum + item.total, 0),
                customerName: 'Test Customer', // You can add a form for this
                customerPhone: '123-456-7890',
                customerEmail: 'test@example.com'
            })
        });

        const order = await response.json();
        alert(`Order placed successfully! Order ID: ${order.id}`);
        cart = [];
        updateCartDisplay();
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    }
}; 