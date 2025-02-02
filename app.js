require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit immediately, allow for graceful shutdown
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    // Don't exit immediately, allow for graceful shutdown
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);  // Remove duplicate authenticateToken as it's already in the routes
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message 
    });
});

const PORT = process.env.PORT || 3000;

// Sync database and start server
async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync database
        await sequelize.sync();
        console.log('Database synced successfully.');

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`
🚀 Server is running on port ${PORT}
📚 API Documentation:
  - POST   /api/auth/register : Register new user
  - POST   /api/auth/login    : Login user
  - GET    /api/menu         : Get all menu items
  - POST   /api/menu         : Create a menu item (admin)
  - POST   /api/orders       : Create an order
  - GET    /api/orders/user  : Get user's orders
  - GET    /api/admin/orders : Get all orders (admin)
`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                sequelize.close();
            });
        });

    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app; 