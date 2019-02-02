module.exports = function(sequelize, DataTypes) {
    var order = sequelize.define("order", {
      idUsuario: DataTypes.INTEGER,
      idClient: DataTypes.INTEGER,
      idSucursal: DataTypes.INTEGER,
      orderNum: DataTypes.STRING,
      status: DataTypes.STRING,
      nombreClient: DataTypes.STRING,
      telefono: DataTypes.STRING

  
    });
    return order;
  };