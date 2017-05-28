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

app.get('/', function(req,res) {
  sql.connect(config, function(err){
    /*if (err) console.log(err);*/

    var request = new sql.Request();
    request.query('select * from backlog', function (err, recordset){
    /*  if (err) console.log(err);*/

      res.render(path.join(__dirname+'/view/index.ejs'), {backlog: recordset});
    });
  });
  /*await sql.close();*/
});


app.listen(3000, function(){ //
    console.log('server is started');
});
