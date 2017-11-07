var express = require("express");
const fileUpload = require('express-fileupload');
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
app.use(fileUpload());

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
  getBacklog(req, res);
});

app.get('/:id', (req, res)=>{
  getBacklog(req, res)
});

app.get('/api/filterBacklog', (req, res) => {
  //console.log(req.query.query);
  const pool = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool);

    request.query(req.query.query, (err, recordset)=>{
      res.send(recordset);
    })
  })
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

app.post('/api/getAttachments', (req, res)=>{
  var getAttachmentRequest = `
    select Id
      ,RequirementId
      ,Name
      ,Path
      ,Timestamp
    from dbo.Attachment
    where RequirementId = ${req.body.req_id} 
    order by Timestamp DESC`;

  const pool = new sql.ConnectionPool(config, err => {
    var request = new sql.Request(pool);

    request.query(getAttachmentRequest, (err, recordset)=>{
      if (err) console.log(err);
      res.send(recordset);
    })
  })
})

app.post('/api/addAttachment', function(req,res) {
  const pool = new sql.ConnectionPool(config, err=> {
    var request = new sql.Request(pool);
    var now = new Date();

    var reqId = req.header('Referer').substring(req.header('Referer').lastIndexOf('/') + 1);

    let sampleFile = req.files.sampleFile;
    let nameWithData = moment().format('YYYY-MM-DD_hh-mm-ss') + '_' + req.files.sampleFile.name;
    let pathToFileForDb = './attachments/' + nameWithData;
    let localPathToFile = 'view/attachments/' + nameWithData;

    const queryInsert = `insert into dbo.Attachment (RequirementId, Name, Path, Timestamp)
      values (
        ${reqId},
        '${sampleFile.name}',
        '${pathToFileForDb}',
        '${moment().format('YYYY-MM-DD hh:mm:ss')}'
      )`;

    request.query(queryInsert, function(err, recordset){
      if (err) console.log(err);
    })
    
    sampleFile.mv(localPathToFile, function(err) {
      if (err)
        return res.status(500).send(err);
  
      return res.status(200).redirect('/' + reqId);
    });
  })
});

app.listen(3000, function(){ //
    console.log('Server is started');
});
