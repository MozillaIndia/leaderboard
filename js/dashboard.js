var bugzilla = createClient();
$('#list').hide();
var details = [];

function displayResults() {
  if(users.length == details.length) {
    for(var i = 0; i < users.length; i++) {
      $('#list').append('<tr><td>' +
        '<img src="http://www.gravatar.com/avatar/' + details[i].hash + '"></td><td>' +
        '<a href="mailto:' + details[i].email + '">' + details[i].name + '</a></td>' +
        '<td><a target="_blank" href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=ALL%20assignee%3A' + details[i].email + '"><span class="badge">' + details[i].total + '</span></a></td>' +
        '<td><span class="badge">' + details[i].fixed + '</span></td>' +
        '<td>' + details[i].access + '</td></tr>');
    }
    $('#list').show();
    $('#loading').hide();
  }
}

for (var i = 0; i < users.length; i++) {
  var hash = md5($.trim(users[i][1]).toLowerCase());
  var name = users[i][0];
  var email = users[i][1];
  var access = "";
  switch(users[i][2]) {
    case 1:
      access = '<span class="label label-info">Level 1</span>';
      break;
    case 2:
      access = '<span class="label label-warning">Level 2</span>';
      break;
    case 3:
      access = '<span class="label label-success">Level 3</span>';
      break;
  }

  var resendFn = function(name, email, hash, access) {
    return function(msg, result) {
      bugzilla.countBugs({email1: email,
                          email1_assigned_to: 1}, loaderFn(name, email, hash, access, result));
    };
  };

  var loaderFn = function(name, email, hash, access, fixed) {
    return function(msg, result) {
      details.push({ name: name,
                     email: email,
                     hash: hash,
                     access: access,
                     fixed: fixed,
                     total: result });
      displayResults();
    };
  };
  bugzilla.countBugs({email1: email,
                      email1_assigned_to: 1,
                      status: 'RESOLVED'}, resendFn(name, email, hash, access));
}