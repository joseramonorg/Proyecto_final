module.exports = function(sequelize, DataTypes) {
  var cliente = sequelize.define("cliente", {
    telefono: DataTypes.STRING,
    nombre: DataTypes.STRING,
    visitas_restantes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    visitas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    confirm_registro: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  });
  return cliente;
};
