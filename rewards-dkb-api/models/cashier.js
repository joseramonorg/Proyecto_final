module.exports = function(sequelize, DataTypes) {
    var cashier = sequelize.define("cashier", {
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      name: DataTypes.STRING
    });
    return cashier;
  };
  