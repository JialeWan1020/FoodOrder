const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/delivery')
    },
    filename: function (req, file, cb) {
        cb(null, 'delivery-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// Update order status with photo upload
router.put('/orders/:id/delivery', upload.single('deliveryPhoto'), async (req, res) => {
    try {
        const { id } = req.params;
        const order = await db.Order.findByPk(id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if photo is provided when marking as delivered
        if (req.body.status === 'delivered' && !req.file) {
            return res.status(400).json({ error: 'Delivery photo is required to mark order as delivered' });
        }

        // Update order with photo and status
        const updateData = {
            status: req.body.status
        };

        if (req.file) {
            updateData.deliveryPhoto = `/uploads/delivery/${req.file.filename}`;
        }

        await order.update(updateData);
        
        res.json(order);
    } catch (error) {
        console.error('Error updating order delivery:', error);
        res.status(500).json({ error: 'Failed to update order delivery' });
    }
});

// Get all menu items
router.get('/menu', async (req, res) => {
    try {
        const menuItems = await db.MenuItem.findAll({
            order: [
                ['category', 'ASC'],
                ['name', 'ASC']
            ]
        });
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Get a single menu item by ID
router.get('/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await db.MenuItem.findByPk(id);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ error: 'Failed to fetch menu item' });
    }
});

// Create a new menu item
router.post('/menu', async (req, res) => {
    try {
        const { name, description, price, category, modifiers, addOns } = req.body;

        // Validate required fields
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Create menu item with modifiers and add-ons
        const menuItem = await db.MenuItem.create({
            name,
            description,
            price,
            category,
            modifiers: modifiers || {},
            addOns: addOns || []
        });

        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ error: 'Failed to create menu item: ' + error.message });
    }
});

// Update a menu item
router.put('/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, modifiers, addOns } = req.body;

        console.log('Updating menu item:', id);
        console.log('Request body:', req.body);

        // Find the menu item
        const menuItem = await db.MenuItem.findByPk(id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        // Update the menu item
        const updatedItem = await menuItem.update({
            name: name || menuItem.name,
            description: description !== undefined ? description : menuItem.description,
            price: price || menuItem.price,
            category: category || menuItem.category,
            modifiers: modifiers || {},
            addOns: addOns || []
        });

        console.log('Updated menu item:', updatedItem.toJSON());
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ error: 'Failed to update menu item: ' + error.message });
    }
});

// Delete a menu item
router.delete('/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await db.MenuItem.findByPk(id);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        await menuItem.destroy();
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        console.log('Fetching orders...');
        const orders = await db.Order.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: db.User,
                as: 'user',
                attributes: ['id', 'username', 'email']
            }]
        });
        console.log('Orders fetched successfully:', orders.length);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch orders',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'processing', 'completed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Find the order
        const order = await db.Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // If trying to mark as delivered without a photo
        if (status === 'delivered' && !order.deliveryPhoto) {
            return res.status(400).json({ 
                error: 'Cannot mark as delivered without a delivery photo. Please upload a delivery photo first.' 
            });
        }

        // Update status
        await order.update({ status });
        
        // Return updated order
        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router; 