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
    })
  })
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

function showRequirementContentTab(){
  document.getElementById('generalTab').style.display = 'flex';
  document.getElementById('commentTab').style.display = 'none';
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

function showRequirementCommentTab(){
  document.getElementById('generalTab').style.display = 'none';
  document.getElementById('commentTab').style.display = 'block';

  $.post('/api/getComment', {req_id: localStorage.getItem('req_id')}, (data)=>{
    loadComment(data);
  });
}
