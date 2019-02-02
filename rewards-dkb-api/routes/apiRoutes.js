var db = require("../models");
var sequelize = require("sequelize");
var Request = require("request");

var messagebird = require('messagebird')('ck8oeHsZ1Q0SKPW6j3YditbAV'); //PRODUCTION
//var messagebird = require('messagebird')('BzRetqaX0UzPID6dZj7wWKc0v'); //DEV



const VISITS_TO_REWARDS = 10;
const MAX_REWARDS_PERMITED = 2;



module.exports = function(app) {




  app.get("/api/clientes", function(req, res) {
    db.cliente.findAll({}).then(function(clientes) {
      res.json(clientes);
    });
  });


  app.post("/api/cliente", function(req, res) {
    db.cliente.create(req.body).then(function(cliente) {
      rewardByNewUser = {
        idCliente: cliente.id,
        descripcion: 'Kebab gratis',
        term_vigencia: (new Date()).setHours(168)
       }
      db.reward.create(rewardByNewUser).then(function(reward){



        Request.post({
          "headers": { "content-type": "application/json",
          "Content-Type": "application/json",
          "apikey": "dc3c27e22298400c98bc39295017b030"
          },
          "url": "https://api.rebrandly.com/v1/links",
          "body": JSON.stringify({
            "destination" : "https://don-kebab-rewards.herokuapp.com/perfil/"+cliente.telefono
            , "domain": { "fullName": "rebrand.ly" }
        })
      }, (error, response, body) => {
          if(error) {
              return console.dir(error);
          }

          var tinyURLuser = JSON.parse(body).shortUrl;

        var params = {
          'originator': 'Don kebab',
          'recipients': [ '52'+cliente.telefono
          ],
          'body': 'Hola '+ cliente.nombre + ' gracias por registrate te has ganado tu primer kebab, da click aqui para ver tu codigo ' + tinyURLuser 
        };
        
        messagebird.messages.create(params, function (err, response) {
          if (err) {
            return console.log(err);
          }
          console.log(response);
        });



        res.json(cliente);

      });



       
      })
      
    });
  });


  app.post("/api/cliente/login", function(req, res) {
    db.cliente.find({ where: { telefono: req.body.telefono } , plain: true }).then(function(cliente) {
      db.reward.findAll({ where: { idCliente: cliente.dataValues.id }}).then(function(rewards){
        cliente.dataValues.rewards = rewards;
        res.json(cliente);
      })
    });

});


app.post("/api/cashier/login", function(req, res) {
  db.cashier.find({ where: { username: req.body.username, password:req.body.password } }).then(function(cashier) {
      res.json(cashier);
  });

});



app.get("/api/sucursales", function(req, res) {
  db.sucursal.findAll({}).then(function(sucursales) {
    res.json(sucursales);
  });
});



app.post("/api/order", function(req, res) {
  console.log(req.body);

  if(Object.prototype != null){
    Object.prototype.isEmpty = function() {
      for(var key in this) {
          if(this.hasOwnProperty(key))
              return false;
      }
      return true;
    }


  }
  
  
  db.order.find({where: { idClient: req.body.idClient}, order: [
    ['createdAt', 'DESC']]}).then(function(oldOrder) {
      db.order.create(req.body).then(function(order) {

        var todaysDate = new Date();
        db.cliente.find({ where: { id: req.body.idClient} , plain: true }).then(function(cliente) {


          var params = {
            'originator': 'Don kebab',
            'recipients': [ '52'+cliente.telefono
            ],
            'body': 'Hola '+cliente.nombre+' tu orden '+order.orderNum+' se esta cocinando, en cuanto esté lista te avisaremos por aquí :) '
          };
          
          messagebird.messages.create(params, function (err, response) {
            if (err) {
              return console.log(err);
            }
            console.log(response);
          });


          if((oldOrder == null || oldOrder.isEmpty()) ||  oldOrder.createdAt.setHours(0,0,0,0) == todaysDate.setHours(0,0,0,0)){ 
              let visitasActuales = ++cliente.visitas;
              var visitasProxReward = --cliente.visitas_restantes;
            console.log("num visit menor o igual a 0 "+ (visitasProxReward <= 0));
              if(visitasProxReward <= 0){
                let totalRewards = 0;

                  db.sequelize.query("SELECT COUNT(*) AS totalRewards FROM rewards WHERE idCliente = " +req.body.idClient).spread((results, metadata) => {
                    totalRewards = results[0].totalRewards;
                
                    console.log("rewards del cliente "+totalRewards);
                    console.log("maximos permitidos "+MAX_REWARDS_PERMITED);
                    if(totalRewards < MAX_REWARDS_PERMITED){

                      visitasProxReward = VISITS_TO_REWARDS;

                      rewardByVisits = {
                        idCliente: cliente.id,
                        descripcion: 'Kebab gratis',
                        term_vigencia: (new Date()).setHours(168)
                      }
                      db.reward.create(rewardByVisits).then(function(reward){ })

                      //update 1 (duplicado por problema de scope optimizar despues)
                      console.log("visit1: "+visitasProxReward);
                  db.sequelize.query("UPDATE clientes SET visitas ="+
                  visitasActuales +", visitas_restantes= "+visitasProxReward +" WHERE id = "+req.body.idClient).spread((results, metadata) => {
                    res.json(order);
                  });

                    }else{
                      visitasProxReward = 1;

                    //update 2 (duplicado por problema de scope optimizar despues)
                      console.log("visit1: "+visitasProxReward);
                  db.sequelize.query("UPDATE clientes SET visitas ="+
                  visitasActuales +", visitas_restantes= "+visitasProxReward +" WHERE id = "+req.body.idClient).spread((results, metadata) => {
                    res.json(order);
                  });


                    }
                  });

                  
              
              }else{
                //update 2 (duplicado por problema de scope optimizar despues)
                console.log("visit2: "+visitasProxReward);
                db.sequelize.query("UPDATE clientes SET visitas ="+
                visitasActuales +", visitas_restantes= "+visitasProxReward +" WHERE id = "+req.body.idClient).spread((results, metadata) => {
                  res.json(order);
                });

              }
        

              
          
          }else{
            res.json(order);
          }
      });  

    });

   

   
  

  });

});


 


app.get("/api/orders/proceso/:idSucursal", function(req, res) {
  db.order.findAll({where: { idSucursal: req.params.idSucursal, status: 'En proceso'}}).then(function(orders) {
    res.json(orders);
  });
});


app.get("/api/orders/finished/:idSucursal", function(req, res) {
  db.order.findAll({where: { idSucursal: req.params.idSucursal,status: 'Finalizada'},
  order: [
    ['orderNum', 'DESC']
]}).then(function(orders) {
    res.json(orders);
  });
});




app.put("/api/orders", function(req, res) {
  var numbersSendedMsg = []
  sequelize.Promise.each(req.body, function(val, index) {

      
      if(!numbersSendedMsg.includes(val.telefono)){
        var params = {
          'originator': 'Don kebab',
          'recipients': [ '52'+val.telefono
          ],
          'body': val.nombreClient+' tu orden esta lista!!! A comer'
        };

        messagebird.messages.create(params, function (err, response) {
          numbersSendedMsg.push(val.telefono);
          if (err) {
             console.log(err);
          }
          console.log(response);
        });
      }

      console.log("LOGGER-----------  ACTUALIZAR ORDEN CON ID "+val.id+" EL STATUS NUEVO ES "+val.status +" COMPLETA EN BD   -------------");

      return db.sequelize.query("UPDATE orders SET status ='"+
          val.status +"' WHERE id = "+ val.id).
          spread((results, metadata) => { console.log(" ACTUALIZACION EXITOSA "); res.json(order);  });


          /**
           * codigo para revisar como opcion mas adelante ya que por el momento manda error en algunas ocasiones.
           * 
           *  return db.order.update({
        status: val.status
    },{
        where:{
            id: val.id
        }
    }).then(function(order) {
      console.log("LOGGER-----------  ACTUALIZADO CORRECTAMENTE  "+order+"  -------------");
    }, function(err){
      console.log("LOGGER-----------  ERROR   "+err+"  -------------");
    });
           * 
           * 
           */
  })
  .then(function(updateAll){
      //done update all
      res.json(updateAll);
  }, function(err){

  });


  /** db.order.update(req.body).then(function(order) {
    res.json(order);
  }); */

 
});


/** 
  // Create a new example
  app.post("/api/managers", function(req, res) {

    db.Manager.create(req.body).then(function(dbExample) {
      res.json(dbExample);
    });
  });


  app.post("/api/login/manager", function(req, res) {
        db.Manager.find({ where: { correo: req.body.correo } }).then(function(manager) {
          res.json(manager);
        });
     
  });

   app.post("/api/login/admin", function(req, res) {
        db.Admin.find({ where: { correo: req.body.correo } }).then(function(admin) {
          req.session.user=admin;
          res.json(admin);
        });
  
  });


   app.post("/api/logout", function(req, res) {
          req.session.destroy(); 
          res.json({});   
  });




   


  app.post("/api/register/sells", function(req, res) {


  req.body.sucursal = req.session.user.sucursal;
  req.body.nombre_gerente = req.session.user.nombre_gerente;
    console.log(req.session.user);
    console.log(req.body);
    db.Ventas.create(req.body).then(function(dbExample) {
      res.json(dbExample);
    });

  });


  app.get("/api/sells/:sucursal", function(req, res) {
    db.Ventas.find({ where: { sucursal: req.params.sucursal } }).then(function(dbExamples) {
      res.json(dbExamples);
    });
  });



  app.post("/api/register/initial/inventory", function(req, res) {
    req.body.sucursal = req.session.user.sucursal;
    req.body.nombre_gerente = req.session.user.nombre_gerente;
    console.log(req.session.user);
    console.log(req.body);
    db.Inventario_inicial.create(req.body).then(function(dbExample) {
      res.json(dbExample);
    });
  });


  app.post("/api/register/final/inventory", function(req, res) {
    req.body.sucursal = req.session.user.sucursal;
    req.body.nombre_gerente = req.session.user.nombre_gerente;
    console.log(req.session.user);
    console.log(req.body);
    db.Inventario_final.create(req.body).then(function(dbExample) {
      res.json(dbExample);
    });
  });

  app.post("/api/register/requisicion", function(req, res) {
    req.body.sucursal = req.session.user.sucursal;
    req.body.nombre_gerente = req.session.user.nombre_gerente;
    console.log(req.session.user);
    console.log(req.body);
    db.Requisicion.create(req.body).then(function(dbExample) {
      res.json(dbExample);
    });
  });



  // Delete an example by id
  app.delete("/api/examples/:id", function(req, res) {
    db.Example.destroy({ where: { id: req.params.id } }).then(function(dbExample) {
      res.json(dbExample);
    });
  });

*/


};


