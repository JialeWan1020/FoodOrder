const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get user's orders
router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching orders for user:', req.user.id);
    
    const orders = await db.Order.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['username', 'email', 'phone']
      }]
    });
    
    console.log('Found orders:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Submit a new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderItems, totalAmount } = req.body;
    
    // Get user information from the token
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'phone'],
      raw: true
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate order items
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ error: 'Invalid order items' });
    }

    // Validate total amount
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    // Log the data being sent to create order
    console.log('Creating order with data:', {
      UserId: user.id,
      orderItems,
      totalAmount,
      customerName: user.username,
      customerPhone: user.phone,
      customerEmail: user.email
    });

    const order = await db.Order.create({
      UserId: user.id,
      orderItems,
      totalAmount,
      customerName: user.username,
      customerPhone: user.phone,
      customerEmail: user.email,
      status: 'pending'
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    // Send more specific error message
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: 'Invalid order data: ' + error.message });
    } else {
      res.status(500).json({ error: 'Failed to create order: ' + error.message });
    }
  }
});

// Get order status
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await db.Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 