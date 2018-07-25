var lastState, reqGroups, reqTypes, reqStatuses, dropdownsWereDrawn, isAdmin, dictionariesWereLoaded;

loadDictionaries();
isAdmin = localStorage.getItem("user_role") === "0";
hideOrShowReqCreateButton();

function dateFormatting(date) {
  var d = new Date(date);
  var monthNames = ["Jan", "Feb", "March", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return d.getDate() + '-' + monthNames[d.getMonth()] + '-' + d.getFullYear();
};

function formatDateForInput(date) {
  var d = new Date(date);
  var month = d.getMonth() < 10 ? '0' + d.getMonth().toString() : d.getMonth().toString();
  return d.getFullYear() + '-' + month + '-' + d.getDate();
}

function createRequirement(){
  showRequirementCard(null, 'create');
}

function editRequirementCard() {
  changeReqCardState('edit');
}

function changeReqCardState(state) {
  if (state === 'view') {
    $('.view-field').show();
    $('.edit-field').hide();
    $('.edit-row').hide();
    $('.hide-in-edit').show();
  } else {
    showRequirementContentTab();
    $('.view-field').hide();
    $('.edit-field').show();
    $('.edit-row').css('display','flex');
    $('.hide-in-edit').hide();
  }

  if (!isAdmin) $('.btn-edit').hide();
}

function showRequirementCard(id, state) {
  if (lastState === 'create' && state !== 'create') {
    $('.hide-in-create').show();
    $('.show-in-create').hide();
  }

  if (!dropdownsWereDrawn && dictionariesWereLoaded) drawDropdowns();

  changeReqCardState(state);

  document.getElementById('requirement-card').style.display = 'block';

  document.getElementById('req_id').innerHTML = id;
  localStorage.setItem('req_id', id);
  if (state !== 'create') {
    $.post('/api/getRequirementId', {req_id: id}, function(data){
      //https://stackoverflow.com/questions/3338642/updating-address-bar-with-new-url-without-hash-or-reloading-the-page
      window.history.pushState("object or string", "Title", "/"+id);

      document.getElementById('req_text').innerHTML =
        document.getElementById('req_text_edit').innerHTML = data.recordset[0].RawDataPlant;
      document.getElementById('req_group').innerHTML = data.recordset[0].Group;
      document.getElementById('req_author').innerHTML = data.recordset[0].Authors;
      document.getElementById('req_authors_edit').value = data.recordset[0].Authors;
      console.log(data.recordset[0].ElicitationDate);
      if (data.recordset[0].ElicitationDate != '1900-01-01T00:00:00.000Z') {

        document.getElementById('req_eliciataion').innerHTML = dateFormatting(data.recordset[0].ElicitationDate);
        $('#req_date_edit').val(formatDateForInput(data.recordset[0].ElicitationDate));
      } else {
        document.getElementById('req_eliciataion').innerHTML = 'N/A'
      }
      document.getElementById('req_prior').innerHTML =
        document.getElementById('req_prior_edit').value = data.recordset[0].Priority;
      document.getElementById('req_isreviewed').innerHTML = data.recordset[0].IsReviewed;
      $('#isreviewed-checkbox').prop('checked', data.recordset[0].IsReviewed == 'no' ? false : true)
      document.getElementById('req_status').innerHTML = data.recordset[0].Status;
      $('#status-select').val(data.recordset[0].StatusId);
      $('#group-select').val(data.recordset[0].GroupId);
      $('#type-select').val(data.recordset[0].TypeId);
      document.getElementById('req_BE').innerHTML =
        document.getElementById('req_BE_edit').value = data.recordset[0].BE_Estimate;
      document.getElementById('req_FE').innerHTML =
        document.getElementById('req_FE_edit').value = data.recordset[0].FE_Estimate;
      if (data.recordset[0].ChangeRequestLink) {
        document.getElementById('req_CR').setAttribute("href", data.recordset[0].ChangeRequestLink);
        document.getElementById('req_CR').style.display = 'inline';
      } else {
        document.getElementById('req_CR').style.display = 'none';
      };
      document.getElementById('req_crLink_edit').value = data.recordset[0].ChangeRequestLink;
      document.getElementById('req_sorce').innerHTML =
        document.getElementById('req_source_edit').value = data.recordset[0].Source;
      document.getElementById('req_notes').innerHTML =
        document.getElementById('req_notes_edit').innerHTML = data.recordset[0].Comment;

      $.post('/api/getCommentAmount', {req_id:id}, (data)=>{
        if (data.recordset[0].commentAmount != 0) {
          document.getElementById('commentAmount').innerHTML = data.recordset[0].commentAmount;
        } else {document.getElementById('commentAmount').innerHTML = ''}
      });

      $('select').material_select();

      $.post('/api/getComment', {req_id: id}, (data)=>{
        loadComment(data);
      });

      $.post('/api/getAttachments', {req_id: id}, (data)=>{
        loadAttachments(data);
      });
    });
  } else {
    $('.hide-in-create').hide();
    $('.show-in-create').show();

    document.getElementById('req_id').innerHTML = ''
    document.getElementById('req_text_edit').innerHTML = '';
    document.getElementById('req_authors_edit').value = '';
    document.getElementById('req_prior_edit').value = '';
    document.getElementById('req_BE_edit').value = '';
    document.getElementById('req_FE_edit').value = '';
    document.getElementById('req_date_edit').value = '';
    document.getElementById('req_CR').setAttribute("href", '');

    document.getElementById('req_source_edit').value = '';
    document.getElementById('req_notes_edit').innerHTML = '';
    document.getElementById('req_crLink_edit').value = '';

    $('#status-select').val(0);
    $('#group-select').val(0);
    $('#type-select').val(0);

    $('select').material_select();
  }

  lastState = state;
};

function saveRequirement() {

  if (!($('#group-select').val() &&
      $('#type-select').val() &&
      $('#req_text_edit').val() &&
      document.getElementById('req_prior_edit').value &&
      $('#status-select').val() &&
      document.getElementById('req_authors_edit').value
    )) {
      alert('Please set Group, Type, Req. text, Priority, Status and Authors');
      return;
    }

    $.post('/api/createOrUpdateRequirement', {
      id: document.getElementById('req_id').innerHTML,
      groupId: $('#group-select').val(),
      typeId: $('#type-select').val(),
      text: $('#req_text_edit').val(),
      priority: document.getElementById('req_prior_edit').value,
      isreviewed: document.getElementById('isreviewed-checkbox').checked ? 1 : 0,
      be: document.getElementById('req_BE_edit').value,
      fe: document.getElementById('req_FE_edit').value,
      statusId: $('#status-select').val(),
      authors: document.getElementById('req_authors_edit').value,
      comment: $('#req_notes_edit').val(),
      source: document.getElementById('req_source_edit').value,
      crLink: document.getElementById('req_crLink_edit').value,
      date: document.getElementById('req_date_edit').value
  }, function(d){
    if (!document.getElementById('req_id').innerHTML) {
      $.post('/api/getNewRequirementId', function(data) {
          alert('New Requirement has been created with Id: ' + data.recordset[0].newId)
      });
    }

    closeRequirementCard();

    location.reload();
  });
}

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
      isAdmin = localStorage.getItem("user_role") === "0";
      hideOrShowReqCreateButton();
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
  hideOrShowReqCreateButton();
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
      showRequirementCard(req_id, 'view')
    }
  } else {
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('create-btn').style.display = 'none';
    document.getElementById('backlog').style.display = 'none';
  }
};
document.addEventListener('DOMContentLoaded', ready);

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
  var isreviewed = document.getElementById('filter-isreviewed').value;

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
  if (isreviewed) query += ` and [IsReviewed] like '%${isreviewed}%'`;

  query += ` and [Status] != 'Archived' order by priority DESC`;

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
      showRequirementCard(parent.getAttribute('data-id'), 'view');
    };
    tr.innerHTML = `
      <td class="center-align modal-trigger"><a href="http://draftrms-budgets.dataart.com:3000/${data[i].Id}">${data[i].Id}</a></td>
      <td class="center-align">${data[i].Group}</td>
      <td class="center-align">${data[i].Type}</td>
      <td>${data[i].RawDataPlant}</td>
      <td class="center-align">${data[i].Priority}</td>
      <td class="center-align">${data[i].BE_Estimate ? data[i].BE_Estimate : ''}</td>
      <td class="center-align">${data[i].FE_Estimate ? data[i].FE_Estimate : ''}</td>
      <td class="center-align">${data[i].Status}</td>
      <td>${data[i].IsReviewed}</td>
      <td>${data[i].Authors}</td>
      <td><a href="${data[i].ChangeRequestLink ? data[i].ChangeRequestLink : '#'}" target="_blank">${data[i].ChangeRequestLink ? data[i].ChangeRequestLink : ''}</a> </td>
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

function loadDictionaries() {
  $.get('/api/getDictionaries', (data) => {
    reqGroups = data.groups.recordset;
    reqTypes = data.types.recordset;
    reqStatuses = data.statuses.recordset;
    dictionariesWereLoaded = true;
    if (!dropdownsWereDrawn) {
      drawDropdowns();
    }
  });
}

function drawDropdowns() {
  drawDropdown('#status-select', reqStatuses);
  drawDropdown('#group-select', reqGroups);
  drawDropdown('#type-select', reqTypes);
  $('select').material_select();

  dropdownsWereDrawn = true;
}

function drawDropdown(selector, data) {
  var elem = $(selector);
  for (var i = 0; i < data.length; i++) {
    elem.append(`<option value="${data[i].Id}">${data[i].Value}</option>`);
  }
}

function hideOrShowReqCreateButton() {
  var btn = $('#create-btn');
  isAdmin ? btn.show() : btn.hide();
}
