const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get all menu items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const menuItems = await db.MenuItem.findAll({
      order: [
        ['category', 'ASC'],
        ['name', 'ASC']
      ]
    });
    if (!menuItems) {
      return res.status(404).json({ error: 'No menu items found' });
    }
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add menu item (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const menuItem = await db.MenuItem.create(req.body);
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 