var express = require("express");
var app = express();
var path = require('path');
var config = require('./setting.js'); //you have to create file which exports json object with settings
var sql = require('mssql');
var bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname+'/view')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//http://www.tutorialsteacher.com/nodejs/access-sql-server-in-nodejs
//https://github.com/patriksimek/node-mssql#connection-pools
//https://stackoverflow.com/questions/24582338/how-can-i-include-css-files-using-node-express-and-ejs
//https://tproger.ru/articles/localstorage/

app.get('/', function(req,res) {
  const pool1 = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool1);
    request.query('select * from backlog order by priority DESC', function (err, recordset) {
      res.render(path.join(__dirname+'/view/index.ejs'), {backlog: recordset});
    });
  });
});

app.post('/api/getRequirementId', function(req, res) {
  const pool1 = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool1);
    request.query('select * from backlog where id = ' + req.body.req_id + 'order by priority DESC', function (err, recordset) {
      res.send(recordset);
    });
  });
});

app.post('/api/login', function(req, res) {
  const pool1 = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool1);
    request.query("select * from [User] where email = '" + req.body.email + "' and [password] = '" + req.body.pass+"'", function (err, recordset) {
      console.log(err);
      res.send(recordset);
    });
  });
});

app.listen(3000, function(){ //
    console.log('Server is started');
});
