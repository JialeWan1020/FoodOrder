module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    orderItems: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    orderNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveryPhoto: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  Order.associate = function(models) {
    Order.belongsTo(models.User, {
      foreignKey: 'UserId',
      as: 'user'
    });
  };

  return Order;
}; 