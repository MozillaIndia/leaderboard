var bugzilla = createClient();
$('#list').hide();
var details = [];

function displayResults() {
  if(users.length == details.length) {
    details.sort(function (a, b) { return b.fixed - a.fixed; });
    for(var i = 0; i < users.length; i++) {
      $('#list').append('<tr>' +
        '<td><img class="avatar" src="http://www.gravatar.com/avatar/' + details[i].hash + '?s=48"></td>' +
        '<td><a href="mailto:' + details[i].email + '">' + details[i].name + '</a></td>' +
        '<td align="center"><a target="_blank" href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=ALL%20assignee%3A' + details[i].email + '"><span class="badge">' + details[i].total + '</span></a></td>' +
        '<td align="center"><span class="badge">' + details[i].fixed + '</span></td>' +
        '<td align="center">' + details[i].access + '</td>' +
        '<td align="right">' + details[i].components + '</td>' +
        '</tr>');
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
    default:
      access = '<span class="label label-default">Level 0</span>';
      break;
  }

  var countAssigned = function(name, email, hash, access) {
    return function(msg, fixed) {
      bugzilla.countBugs({email1: email,
                          email1_assigned_to: 1}, countComponent(name, email, hash, access, fixed));
    };
  };

  var countComponent = function(name, email, hash, access, fixed) {
    return function(msg, assigned) {
      bugzilla.countBugsX({
        x_axis_field: "product",
        y_axis_field: "component",
        "field0-0-0": "attachment.is_patch",
        "type0-0-0": "equals",
        "value0-0-0": 1,
        "field0-2-0": "attachment.attacher",
        "type0-2-0": "equals",
        "value0-2-0": email,
        "field0-1-0": "flagtypes.name",
        "type0-1-0": "contains",
        "value0-1-0": "+",
        email1: email,
        email1_assigned_to: 1,
        status: ['RESOLVED', 'VERIFIED'],
        resolution: ['FIXED']
      }, loaderFn(name, email, hash, access, fixed, assigned));
    };
  };

  var loaderFn = function(name, email, hash, access, fixed, assigned) {
    return function(msg, components) {
      var obj = { name: name,
                  email: email,
                  hash: hash,
                  access: access,
                  fixed: fixed,
                  components: "",
                  total: assigned };
      var data = [];
      if (components.data.length) {
        data = data.concat.apply(data, components.data);
        var largest = Math.max.apply(Math, data);
        var index = data.indexOf(largest);
        if (largest > 0) {
          obj.components = ((components.x_labels[index%components.x_labels.length] || "") + " :: " +
                            (components.y_labels[index/components.x_labels.length|0] || ""))
                            .replace(/(^ :: | :: $)/g, "");
        }
      }
      details.push(obj);
      displayResults();
    };
  };

  // Count fixed bugs
  bugzilla.countBugs({
    "field0-0-0": "attachment.is_patch",
    "type0-0-0": "equals",
    "value0-0-0": 1,
    "field0-2-0": "attachment.attacher",
    "type0-2-0": "equals",
    "value0-2-0": email,
    "field0-1-0": "flagtypes.name",
    "type0-1-0": "contains",
    "value0-1-0": "+",
    email1: email,
    email1_assigned_to: 1,
    status: ['RESOLVED', 'VERIFIED'],
    resolution: ['FIXED']
  }, countAssigned(name, email, hash, access));
}
