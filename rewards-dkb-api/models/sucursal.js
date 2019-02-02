module.exports = function(sequelize, DataTypes) {
    var sucursal = sequelize.define("sucursal", {
      nombre: DataTypes.STRING
    });
    return sucursal;
  };
  