var bugzilla = createClient();
$('#list').hide();
var details = [];

function getMax(set) {
  var component = "";
  var num = 0;
  for(var key in set) {
    if (set[key] > num) {
      num = set[key];
      component = key;
    }
  }
  return component;
}

function displayResults() {
  if(users.length == details.length) {
    details.sort(function (a, b) { return b.fixed - a.fixed; });
    for(var i = 0; i < users.length; i++) {
      $('#list').append('<tr><td>' +
        '<img src="http://www.gravatar.com/avatar/' + details[i].hash + '">' +
        '<br><a href="mailto:' + details[i].email + '">' + details[i].name + '</a></td>' +
        '<td align="center"><a target="_blank" href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=ALL%20assignee%3A' + details[i].email + '"><span class="badge">' + details[i].total + '</span></a></td>' +
        '<td align="center"><span class="badge">' + details[i].fixed + '</span></td>' +
        '<td align="center">' + details[i].access + '</td>' +
        '<td>' + getMax(details[i].components) + '</td></tr>');
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
      var obj = { name: name,
                  email: email,
                  hash: hash,
                  access: access,
                  fixed: fixed.length,
                  components: {},
                  total: result };
      for(var i = 0; i < fixed.length; i++) {
        if(obj.components[fixed[i].product + "::" + fixed[i].component] == undefined)
          obj.components[fixed[i].product + "::" + fixed[i].component] = 1;
        else
          obj.components[fixed[i].product + "::" + fixed[i].component]++;
      }
      details.push(obj);
      displayResults();
    };
  };
  bugzilla.searchBugs({email1: email,
                      email1_assigned_to: 1,
                      status: ['RESOLVED', 'VERIFIED'],
                      resolution: ['FIXED']}, resendFn(name, email, hash, access));
}
