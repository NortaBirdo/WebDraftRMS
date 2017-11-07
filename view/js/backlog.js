function dateFormatting(date) {
  var d = new Date(date);
  var monthNames = ["Jan", "Feb", "March", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return d.getDate() + '-' + monthNames[d.getMonth()] + '-' + d.getFullYear();
};

function showRequirementCard(id) {
  document.getElementById('requirement-card').style.display = 'block';

  document.getElementById('req_id').innerHTML = id;
  localStorage.setItem('req_id', id);
  $.post('/api/getRequirementId', {req_id: id}, function(data){
    //https://stackoverflow.com/questions/3338642/updating-address-bar-with-new-url-without-hash-or-reloading-the-page
    window.history.pushState("object or string", "Title", "/"+id);

    document.getElementById('req_text').innerHTML = data.recordset[0].RawDataPlant;
    document.getElementById('req_group').innerHTML = data.recordset[0].Group;
    document.getElementById('req_author').innerHTML = data.recordset[0].Authors;
    if (data.recordset[0].ElicitationDate) {
      document.getElementById('req_eliciataion').innerHTML = dateFormatting(data.recordset[0].ElicitationDate)
    } else {
      document.getElementById('req_eliciataion').innerHTML = 'N/A'
    }
    document.getElementById('req_prior').innerHTML = data.recordset[0].Priority;
    document.getElementById('req_status').innerHTML = data.recordset[0].Status;
    document.getElementById('req_BE').innerHTML = data.recordset[0].BE_Estimate;
    document.getElementById('req_FE').innerHTML = data.recordset[0].FE_Estimate;
    if (data.recordset[0].ChangeRequestLink) {
      document.getElementById('req_CR').setAttribute("href", data.recordset[0].ChangeRequestLink);
      document.getElementById('req_CR').style.display = 'inline';
    } else {
      document.getElementById('req_CR').style.display = 'none';
    };
    document.getElementById('req_sorce').innerHTML = data.recordset[0].Source;
    document.getElementById('req_notes').innerHTML = data.recordset[0].Comment;

    $.post('/api/getComment', {req_id: id}, (data)=>{
      loadComment(data);
    });

    $.post('/api/getAttachments', {req_id: id}, (data)=>{
      loadAttachments(data);
    });
  });
};

function closeRequirementCard(){
  document.getElementById('requirement-card').style.display = 'none';
  window.history.pushState("", "", "/");
};

function showLoginCard(){
  document.getElementById('login-card').style.display = 'block';
};

function login(){
  $.post('/api/login', {
    email: document.getElementById('email').value,
    pass: document.getElementById('pass').value
  },
  function(data){
    if (data.recordset[0].Name) {
      document.getElementById('login-card').style.display = 'none';
      document.getElementById('login-btn').style.display = 'none';
      document.getElementById('logout-btn').style.display = 'inline-block';
      document.getElementById('create-btn').style.display = 'inline-block';
      document.getElementById('backlog').style.display = 'block';
      localStorage.setItem('user', data.recordset[0].Name);
      localStorage.setItem('user_id', data.recordset[0].Id);
      localStorage.setItem('user_role', data.recordset[0].Role);
      localStorage.setItem('user_email', data.recordset[0].Email);
    }
  }
)};

function logout (){
  var date = new Date(0);
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('create-btn').style.display = 'none';
  document.getElementById('backlog').style.display = 'none';
  document.getElementById('login-btn').style.display = 'inline-block';
  closeRequirementCard();
};

function sendComment(){
  var answer = document.getElementById('answer');
  if (answer.value) {
    $.post('/api/addcomment', {
      text: document.getElementById('answer').value,
      user_id: localStorage.getItem('user_id'),
      req_id: localStorage.getItem('req_id')
    }, function(d){
      $.post('/api/getComment', {req_id: localStorage.getItem('req_id')}, (data)=>{
        loadComment(data);
        answer.value = "";
      });
    });
  }
};

function ready(){
  if (localStorage.getItem('user')) {
    document.getElementById('login-btn').style.display = 'none';
    let req_id = window.location.href.match(/\d+$/ig);
    if (req_id ) {
      showRequirementCard(req_id)
    }
  } else {
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('create-btn').style.display = 'none';
    document.getElementById('backlog').style.display = 'none';
  }
};
document.addEventListener('DOMContentLoaded', ready);

function createRequirement(){
  alert(localStorage.getItem('user'));
}

function loadComment(data) {
  if (data) {
    var feed  = document.getElementById('feed');
    
    while(feed.childNodes[0]){
     feed.removeChild(feed.childNodes[0]);
    }

    for (var i = 0; i < data.recordset.length; i++) {
      var comment = document.createElement('div');
      comment.className = 'comment';

      var commentHeader = document.createElement('p');
      commentHeader.className = 'comment-header';
      commentHeader.innerHTML = 'Comment was written at '+ dateFormatting(data.recordset[i].Timestamp) + ' by ' + data.recordset[i].UserName;
      comment.appendChild(commentHeader);

      var commentText = document.createElement('p');
      commentText.innerHTML = data.recordset[i].Text;
      comment.appendChild(commentText);

      feed.appendChild(comment);
    }
  }
};

function loadAttachments(data) {
  var list  = document.getElementById('attachment-list');
  if (list.children.length)
    while(list.childNodes[0]){
      list.removeChild(list.childNodes[0]);
    }

  if (!data) return;  

  for (var i = 0; i < data.recordset.length; i++) {
    var attachment = document.createElement('li');
    attachment.className = 'attachment';
    attachment.innerHTML = '<span>' + data.recordset[i].Name + '</span><a href="' + data.recordset[i].Path + '" download="' + data.recordset[i].Name + '" class="file-link"><i class="fa fa-download" aria-hidden="true" data-file-name="' + data.recordset[i].Path + '"></i></a>';
    list.appendChild(attachment);
  }
}

function showRequirementContentTab(){
  document.getElementById('generalTab').style.display = 'flex';
  document.getElementById('commentTab').style.display = 'none';
  document.getElementById('attachment-tab').style.display = 'none';
}

function showRequirementCommentTab(){
  document.getElementById('generalTab').style.display = 'none';
  document.getElementById('commentTab').style.display = 'block';
  document.getElementById('attachment-tab').style.display = 'none';

  $.post('/api/getComment', {req_id: localStorage.getItem('req_id')}, (data)=>{
    loadComment(data);
  });
}

function showRequirementAttachmentTab(){
  document.getElementById('generalTab').style.display = 'none';
  document.getElementById('commentTab').style.display = 'none';
  document.getElementById('attachment-tab').style.display = 'block';

  $.post('/api/getComment', {req_id: localStorage.getItem('req_id')}, (data)=>{
    loadComment(data);
  });
}

var timer;


function filterKeyUp() {
  if(timer) {
      clearTimeout(timer);
  }
  
  timer = setTimeout(filterData, 700);
}

function constructQuery() {
  var id = document.getElementById('filter-id').value;
  var group = document.getElementById('filter-group').value;
  var type = document.getElementById('filter-type').value;
  var requirement = document.getElementById('filter-requirement').value;
  var priority = document.getElementById('filter-priority').value;
  var be = document.getElementById('filter-be').value;
  var fe = document.getElementById('filter-fe').value;
  var status = document.getElementById('filter-status').value;
  var authors = document.getElementById('filter-authors').value;
  var crLink = document.getElementById('filter-cr-link').value;
  var source = document.getElementById('filter-source').value;

  var query = 'select * from backlog where 1=1';
  if (id) query += ' and id = ' + id;
  if (priority) query += ' and [priority] = ' + priority;
  if (be) query += ' and BE_Estimate = ' + be;
  if (fe) query += ' and FE_Estimate = ' + fe;
  if (group) query += ` and [group] like '%${group}%'`;
  if (type) query += ` and [type] like '%${type}%'`;
  if (requirement) query += ` and [RawDataPlant] like '%${requirement}%'`;
  if (status) query += ` and [status] like '%${status}%'`;
  if (authors) query += ` and [authors] like '%${authors}%'`;
  if (crLink) query += ` and [ChangeRequestLink] like '%${crLink}%'`;
  if (source) query += ` and [source] like '%${source}%'`;

  query += ' order by priority DESC';

  return query;
}

function filterData() {
  var query = constructQuery();
  $.get('/api/filterBacklog', {query: query}, (data)=>{
    if (data.recordset.length) renderFilteredData(data.recordset);
    else {
      var elem = document.getElementsByClassName('no-data-fetched')[0];
      elem.className += ' shown';
      setTimeout(() => {
        var span = document.getElementsByClassName('no-data-fetched')[0];
        span.className = 'no-data-fetched';
      }, 4000);
    }
  });
}

function renderFilteredData(data) {
  var tbody = document.getElementById('backlog-body');
  tbody.innerHTML = '';

  for (i = 0; i < data.length; i++) {
    var tr = document.createElement('tr');
    tr.className = 'tr-hided';
    tr.setAttribute('data-id', data[i].Id)
    tr.onclick = (e) => {
      var parent = e.target.href ? e.target.parentElement.parentElement : e.target.parentElement;      
      showRequirementCard(parent.getAttribute('data-id')); 
    };
    tr.innerHTML = `
      <td class="center-align modal-trigger"><a href="localhost:3000/${data[i].Id}">${data[i].Id}</a></td>
      <td class="center-align">${data[i].Group}</td>
      <td class="center-align">${data[i].Type}</td>
      <td>${data[i].RawDataPlant}</td>
      <td class="center-align">${data[i].Priority}</td>
      <td class="center-align">${data[i].BE_Estimate ? data[i].BE_Estimate : ''}</td>
      <td class="center-align">${data[i].FE_Estimate ? data[i].FE_Estimate : ''}</td>
      <td class="center-align">${data[i].Status}</td>
      <td>${data[i].Authors}</td>
      <td><a href="${data[i].ChangeRequestLink ? data[i].ChangeRequestLink : '#'}" target="_blank">${data[i].ChangeRequestLink ? data[i].ChangeRequestLink : ''}</a> </td>
      <td>${data[i].Source ? data[i].Source : ''}</td>
    `;

    tbody.appendChild(tr);
  }

  var trs = tbody.getElementsByTagName('tr');
  var i = 0;
  (function loop() {
    trs[i].className = '';
    if (++i < trs.length) {
        setTimeout(loop, 40);
    }
  })();
}