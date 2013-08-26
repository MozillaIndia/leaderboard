var bugzilla = createBugzillaClient();
var github = createGitHubClient();
var details = JSON.parse(localStorage.getItem("data-details") || '[]');
// Sanitize the data stored in localstorage
for (var i = 0; i < details.length; i++) {
  for (var key in details[i]) {
    if (key.length > 1) {
      delete details[i][key];
    }
  }
}
var pushed = JSON.parse(localStorage.getItem("data-pushed") || '{}');
var numFixedRecieved = 0;
var numAssignedRecieved = 0;
var numComponentsRecieved = 0;
var gitRecieved = 0;
var gitNumbers = {};

function sortResults() {
  var table = document.querySelector('#list tbody');
  var items = table.childNodes;
  var itemsArr = [];
  for (var i in items) {
    if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
      itemsArr.push(items[i]);
    }
  }

  itemsArr.sort(function(a, b) {
    try {
      a = details[pushed[a.id]].f;
      b = details[pushed[b.id]].f;
      return a > b ? -1 : 1;
    } catch (ex) {
      return 1;
    }
  });

  for (i = 0; i < itemsArr.length; ++i) {
    table.appendChild(itemsArr[i]);
  }
}

function maybeUpdateLocalStorage() {
  if (numComponentsRecieved == users.length &&
      numAssignedRecieved == users.length &&
      numFixedRecieved == users.length &&
      gitRecieved == users.length) {
    localStorage.removeItem("data-pushed");
    localStorage.removeItem("data-details");
    localStorage.setItem("data-pushed", JSON.stringify(pushed));
    localStorage.setItem("data-details", JSON.stringify(details));
  }
}

users.sort(function(a, b) {
  var trimmedEmail1 = a[1].replace(/[.@]/g, "");
  var trimmedEmail2 = b[1].replace(/[.@]/g, "");
  try {
    var aa = details[pushed[trimmedEmail1]].f || 0;
    var bb = details[pushed[trimmedEmail2]].f || 0;
    return aa < bb ? 1 : -1;
  } catch (ex) {
    return -1;
  }
});

var buffer = "";

for (var i = 0; i < users.length; i++) {
  var hash = md5($.trim(users[i][1]).toLowerCase());
  var name = users[i][0];
  var email = users[i][1];
  var trimmedEmail = email.replace(/[.@]/g, "");
  gitNumbers[trimmedEmail] = [];
  if (!users[i][2]) {
    gitRecieved++;
  }
  var access = "";
  switch(users[i][3]) {
    case 1:
      access = '<span class="label label-info">Level 1</span>';
      break;
    case 2:
      access = '<span class="label label-warning">Level 2</span>';
      break;
    case 3:
      access = '<span class="label label-success">Level 3</span>';
      break;
    default:
      access = '<span class="label label-default">Level 0</span>';
      break;
  }

  var fixed = "", assigned = "", component = "", git = "";
  if (pushed[trimmedEmail] != undefined) {
    var obj = details[pushed[trimmedEmail]];
    fixed = obj.f > -1 ? obj.f: "";
    assigned = obj.a > -1 ? obj.a: "";
    git = obj.g > -1 ? obj.g: "";
    component = obj.c || "";
  }
  buffer += '<tr id="' + trimmedEmail + '">' +
    '<td><img class="avatar" src="http://www.gravatar.com/avatar/' + hash + '?s=48"></td>' +
    '<td><a href="mailto:' + email + '">' + name + '</a></td>' +
    '<td align="center"><a target="_blank" href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=ALL%20assignee%3A' + email + '"><span class="badge assigned" value="' + assigned + '">' + assigned + '</span></a></td>' +
    '<td align="center"><span class="badge fixed" value="' + fixed + '">' + fixed + '</span></td>' +
    '<td align="center"><span class="badge git" value="' + git + '">' + git + '</span></td>' +
    '<td align="center">' + access + '</td>' +
    '<td align="right" class="component">' + component + '</td>' +
    '</tr>';

  if (pushed[trimmedEmail] == undefined) {
    pushed[trimmedEmail] = details.length;
    details.push({});
  }
}

$("#list > tbody").html(buffer);

// Get GitHub stats
for (var i = 0, repo = mozGitRepos[i][1];
     mozGitRepos[i] && (repo = mozGitRepos[i][1]) && i < mozGitRepos.length;
     i++) {
  github.getContributorList(repo, function(list) {
    var repoContributorList = {};
    for (var k = 0, item = list[k]; (item = list[k]) && k < list.length; k++) {
      repoContributorList[item.login] = 1;
    }
    for (var k = 0, login = users[k][2];
         (users[k] && (login = users[k][2])) || k < users.length; k++) {
      var trimmedEmail = users[k][1].replace(/[.@]/g, "");
      if (repoContributorList[login]) {
        github.getCommitList(this, login, function callback(commitList) {
          gitNumbers[this].push(commitList.length);
          if (gitNumbers[this].length == mozGitRepos.length) {
            gitRecieved++;
            var sum = eval(gitNumbers[this].join("+"));
            details[pushed[this]].g = sum;
            $("#" + this + " .git").text(sum).attr("value", sum);
            maybeUpdateLocalStorage();
          }
          return;
        }.bind(trimmedEmail));
      }
      else {
        gitNumbers[trimmedEmail].push(0);
        if (gitNumbers[trimmedEmail].length == mozGitRepos.length) {
          gitRecieved++;
          var sum = eval(gitNumbers[trimmedEmail].join("+"));
          details[pushed[trimmedEmail]].g = sum;
          $("#" + trimmedEmail + " .git").text(sum).attr("value", sum);
          maybeUpdateLocalStorage();
        }
      }
    }
  }.bind(repo));
}

// Get Bugzilla stats.
for (var i = 0; i < users.length; i++) {
  var email = users[i][1];
  var trimmedEmail = email.replace(/[.@]/g, "");

  // Count fixed
  bugzilla.countBugs({
    "field0-0-0": "attachment.is_patch",
    "type0-0-0": "equals",
    "value0-0-0": 1,
    "field0-1-0": "flagtypes.name",
    "type0-1-0": "contains",
    "value0-1-0": "+",
    email1: email,
    email1_assigned_to: 1,
    status: ['RESOLVED', 'VERIFIED'],
    resolution: ['FIXED']
  }, function(error, fixed) {
    if (error) {
      return;
    }
    details[pushed[this]].f = fixed;
    $("#" + this + " .fixed").text(fixed).attr("value", fixed);
    if (++numFixedRecieved == users.length) {
      sortResults();
      maybeUpdateLocalStorage();
    }
  }.bind(trimmedEmail));

  // Count assigned
  bugzilla.countBugs({
    email1: email,
    email1_assigned_to: 1
  }, function(error, assigned) {
    if (error) {
      return;
    }
    details[pushed[this]].a = assigned;
    $("#" + this + " .assigned").text(assigned).attr("value", assigned);
    maybeUpdateLocalStorage(++numAssignedRecieved);
  }.bind(trimmedEmail));

  // Calculate Component
  bugzilla.countBugsX({
    x_axis_field: "product",
    y_axis_field: "component",
    "field0-0-0": "attachment.is_patch",
    "type0-0-0": "equals",
    "value0-0-0": 1,
    "field0-1-0": "flagtypes.name",
    "type0-1-0": "contains",
    "value0-1-0": "+",
    email1: email,
    email1_assigned_to: 1,
    status: ['RESOLVED', 'VERIFIED'],
    resolution: ['FIXED']
  }, function(error, components) {
    if (error) {
      return;
    }
    var data = [];
    if (components && components.data && components.data.length) {
      data = data.concat.apply(data, components.data);
      var largest = Math.max.apply(Math, data);
      var index = data.indexOf(largest);
      if (largest > 0) {
        var component = ((components.x_labels[index%components.x_labels.length] || "") + " :: " +
                         (components.y_labels[index/components.x_labels.length|0] || ""))
                          .replace(/(^ :: | :: $)/g, "");
        $("#" + this + " .component").text(component);
        details[pushed[this]].c = component;
      }
    }
    maybeUpdateLocalStorage(++numComponentsRecieved);
  }.bind(trimmedEmail));

}
