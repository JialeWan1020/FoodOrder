const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let adminToken = '';

async function testAPI() {
  try {
    // Test 1: Register a regular user
    console.log('Test 1: Registering a new user...');
    const user = await axios.post(`${API_URL}/auth/register`, {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com'
    });
    console.log('User registered:', user.data);
    authToken = user.data.token;

    // Test 2: Register an admin user
    console.log('\nTest 2: Registering an admin user...');
    const admin = await axios.post(`${API_URL}/auth/register`, {
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin'
    });
    console.log('Admin registered:', admin.data);
    adminToken = admin.data.token;

    // Test 3: Login as user
    console.log('\nTest 3: Testing user login...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log('Login successful:', login.data);

    // Test 4: Create a menu item (as admin)
    console.log('\nTest 4: Creating a menu item...');
    const menuItem = await axios.post(`${API_URL}/admin/menu`, {
      name: 'Margherita Pizza',
      price: 12.99,
      description: 'Classic Italian pizza with tomato and mozzarella',
      category: 'Pizza'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Menu item created:', menuItem.data);

    // Test 5: Get all menu items (as user)
    console.log('\nTest 5: Getting all menu items...');
    const menuItems = await axios.get(`${API_URL}/menu`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Menu items retrieved:', menuItems.data);

    // Test 6: Create an order (as user)
    console.log('\nTest 6: Creating an order...');
    const order = await axios.post(`${API_URL}/orders`, {
      orderItems: [{
        menuItemId: menuItem.data.id,
        quantity: 2,
        modifiers: [],
        addOns: []
      }],
      totalAmount: 25.98,
      customerName: 'John Doe',
      customerPhone: '123-456-7890',
      customerEmail: 'john@example.com'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Order created:', order.data);

    // Test 7: Get order status (as user)
    console.log('\nTest 7: Getting order status...');
    const orderStatus = await axios.get(`${API_URL}/orders/${order.data.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Order status:', orderStatus.data);

    // Test 8: Update menu item (as admin)
    console.log('\nTest 8: Updating menu item...');
    const updatedMenuItem = await axios.put(`${API_URL}/admin/menu/${menuItem.data.id}`, {
      price: 13.99
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Menu item updated:', updatedMenuItem.data);

    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Install axios first: npm install axios
testAPI(); 