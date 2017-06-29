var express = require("express");
var app = express();
var path = require('path');
var config = require('./setting.js'); //you have to create file which exports connection string
var sql = require('mssql');
var bodyParser = require('body-parser');
var moment = require('moment');

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

function getBacklog(req, res) {
  const pool = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool);
    request.query('select * from backlog order by priority DESC', function (err, recordset) {
      res.render(path.join(__dirname+'/view/index.ejs'), {backlog: recordset});
    });
  });
}

app.get('/', function(req,res) {
  getBacklog(req, res)
});

app.get('/:id', (req, res)=>{
  getBacklog(req, res)
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
      if (err) console.log(err);
      res.send(recordset);
    });
  });
});

app.post ('/api/getComment', (req, res)=>{
  var getCommentRequest = `
    select c.[Id]
      ,c.[Text]
      ,c.[Timestamp]
      ,u.[Name] as UserName from comment as c
      left join [User] as u on u.id = c.UserId
      where c.RequirementId = ${req.body.req_id} order by c.[Timestamp] DESC`;

  const pool = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool);

    request.query(getCommentRequest, (err, recordset)=>{
      if (err) console.log(err);
      res.send(recordset);
    })
  })
})

app.post('/api/addcomment', function(req,res) {
  const pool = new sql.ConnectionPool(config, err=> {
    var request = new sql.Request(pool);
    var now = new Date();

    const queryInsert = `insert into Comment ([Text], [UserId], [Timestamp], [RequirementId])
      values (
        '${req.body.text}',
        ${req.body.user_id},
        '${moment().format('YYYY-MM-DD hh:mm:ss')}',
        ${req.body.req_id}
      )`;

    request.query(queryInsert, function(err, recordset){
      if (err) console.log(err);
      res.send(recordset);
    })
  })
});

app.listen(3000, function(){ //
    console.log('Server is started');
});
