var express = require("express");
var app = express();
var path = require('path');
var setting = require('./setting.js'); //you have to create file which exports json object with settings

var sql = require('mssql');
var config = {
  user: setting.user,
  password: setting.password,
  server: setting.server,
  db: setting.db,
};

app.set('view engine', 'ejs');

//http://www.tutorialsteacher.com/nodejs/access-sql-server-in-nodejs
//https://github.com/patriksimek/node-mssql#connection-pools

app.get('/', function(req,res) {
  const pool1 = new sql.ConnectionPool(config, err=> {
    var request = new sql.Request(pool1);
    request.query('select * from backlog', function (err, recordset){
      res.render(path.join(__dirname+'/view/index.ejs'), {backlog: recordset});
    });
  });
});


app.listen(3000, function(){ //
    console.log('server is started');
});
