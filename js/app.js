// The application specific JS goes in here

// Global namespace
var leaderboard = {};

// Closure to encapsule the executables
(function () {

  leaderboard.mostActiveOf = function (data) {
    var counts = [], components = [];
    if (Object.keys(data).length !== 0) {
      for (var i in data) {
        components.push(i);
        counts.push(data[i]);
      }
      return components[counts.indexOf(Math.max.apply(window, counts))];
    } else return "";
  }

  leaderboard.bugLinksOf = function (email) {
    if (email) {
      return 'target="_blank" href="https://bugzilla.mozilla.org/' +
        'buglist.cgi?quicksearch=ALL%20assignee%3A' + email + '"';
    } else return "";
  }

  leaderboard.accessLevel = function (access) {
    switch(access) {
      case 1:
        return '<span class="label label-info">Level 1</span>';
      case 2:
        return '<span class="label label-warning">Level 2</span>';
      case 3:
        return '<span class="label label-success">Level 3</span>';
      default:
        return '<span class="label label-default">Level 0</span>';
    }
  }

  leaderboard.sortResults = function () {
    var table = document.querySelector("#list tbody")
    ,   items = table.childNodes
    ,   itemsArr = [];

    for (var i in items) {
      if (items[i].nodeType == 1) itemsArr.push(items[i]);
    }

    itemsArr.sort(function(a, b) {
      a = a.childNodes[3].childNodes[0].innerHTML;
      b = b.childNodes[3].childNodes[0].innerHTML;
      return (b-a);
    });

    for (var i in itemsArr) {
      table.appendChild(itemsArr[i]);
    }
  }

  $.ajax({
    url: "http://devs.mozillaindia.org/stats/india.json"
  }).done(function (data) {
    var dom = "";

    // @TODO:
    // 0. Turn this into a for..of loop
    // 1. Use arrow-function for components' weight
    for (var i in data) {
      var item = data[i];

      if (item.bugzilla.fixed) dom += '<tr>' +
        '<td><img class="avatar" src="http://www.gravatar.com/avatar/' + item.gravatar + '?s=48"></td>' +
        '<td><a href="mailto:' + item.email + '">' + item.name + '</a></td>' +
        '<td align="center"><a ' + leaderboard.bugLinksOf(item.email) + '>' +
        '<span class="badge assigned">' + item.bugzilla.assigned + '</span></a></td>' +
        '<td align="center"><span class="badge fixed">' + item.bugzilla.fixed + '</span></td>' +
        '<td align="center">' + leaderboard.accessLevel(item.level) + '</td>' +
        '<td align="right" class="component">' + leaderboard.mostActiveOf(item.components) + '</td>' +
        '</tr>';
    }

    // @TODO: throw this DOM-sorting in the gutter & wash hands...
    // Sort the stats.json data itself, before putting in the DOM.
    $("#list").append(dom);
    leaderboard.sortResults();
    setTimeout(function(){$("#list").tablesorter({headers: {0: {sorter: false}}});},100);

  }).fail(function (error) {
    console.log(error);
  });
})();
