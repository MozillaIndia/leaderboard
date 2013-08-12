var bugzilla = createClient();
var details = [];
var pushed = {};
var count = 0;;

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
    a = details[pushed[a.id]].fixed;
    b = details[pushed[b.id]].fixed;
    return a > b ? -1 : 1;
  });

  for (i = 0; i < itemsArr.length; ++i) {
    table.appendChild(itemsArr[i]);
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

  $('#list tbody').append('<tr id="' + email.replace(/[.@]/g, "") + '">' +
    '<td><img class="avatar" src="http://www.gravatar.com/avatar/' + hash + '?s=48"></td>' +
    '<td><a href="mailto:' + email + '">' + name + '</a></td>' +
    '<td align="center"><a target="_blank" href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=ALL%20assignee%3A' + email + '"><span class="badge assigned" value=""></span></a></td>' +
    '<td align="center"><span class="badge fixed" value=""></span></td>' +
    '<td align="center">' + access + '</td>' +
    '<td align="right" class="component"></td>' +
    '</tr>');

  pushed[email.replace(/[.@]/g, "")] = i;
  details.push({
    name: name,
    email: email,
    hash: hash,
    access: access
  });

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
  }, function(msg, fixed) {
    details[pushed[this]].fixed = fixed;
    $("#" + this + " .fixed").text(fixed).attr("value", fixed);
    if (++count == users.length) {
      sortResults();
    }
  }.bind(email.replace(/[.@]/g, "")));

  // Count assigned
  bugzilla.countBugs({
    email1: email,
    email1_assigned_to: 1
  }, function(msg, assigned) {
    details[pushed[this]].assigned = assigned;
    $("#" + this + " .assigned").text(assigned).attr("value", assigned);
  }.bind(email.replace(/[.@]/g, "")));

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
  }, function(msg, components) {
    var data = [];
    if (components.data.length) {
      data = data.concat.apply(data, components.data);
      var largest = Math.max.apply(Math, data);
      var index = data.indexOf(largest);
      if (largest > 0) {
        var component = ((components.x_labels[index%components.x_labels.length] || "") + " :: " +
                         (components.y_labels[index/components.x_labels.length|0] || ""))
                          .replace(/(^ :: | :: $)/g, "");
        $("#" + this + " .component").text(component);
        details[pushed[this]].component = component;
      }
    }
  }.bind(email.replace(/[.@]/g, "")));

}
