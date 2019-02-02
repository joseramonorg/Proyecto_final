module.exports = function(sequelize, DataTypes) {
    var reward = sequelize.define("reward", {
      idCliente: DataTypes.INTEGER,
      descripcion: DataTypes.STRING,
      term_vigencia: DataTypes.DATE,
      redimida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    });
    return reward;
  };
  