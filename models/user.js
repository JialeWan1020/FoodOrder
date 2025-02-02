module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    }
  }, {
    modelName: 'User',
    tableName: 'Users'
  });

  User.associate = function(models) {
    User.hasMany(models.Order, {
      foreignKey: 'UserId',
      as: 'orders'
    });
  };

  // Add password validation method
  User.prototype.validatePassword = function(password) {
    return password === this.password; // Note: In production, use proper password hashing
  };

  return User;
}; 