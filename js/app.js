// The application specific JS goes in here

// Global namespace
var leaderboard = {};

// Closure to encapsule the executables
(function () {

  leaderboard.mostActiveOf = function (data) {
    var counts = [], components = [];
    for (var i in data) {
      components.push(i);
      counts.push(data[i]);
    }
    return components[counts.indexOf(Math.max.apply(window, counts))];
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
    url: "stats.json"
  }).done(function (data) {
    var dom = "";

    // @TODO:
    // 0. Turn this into a for..of loop
    // 1. Use arrow-function for components' weight
    for (var i in data) {
      var item = data[i];

      dom += '<tr id="' + item.email + '">' +
        '<td><img class="avatar" src="http://www.gravatar.com/avatar/' + item.gravatar + '?s=48"></td>' +
        '<td><a href="#">' + item.name + '</a></td>' +
        '<td align="center"><span class="badge assigned">' + item.bugzilla.assigned + '</span></td>' +
        '<td align="center"><span class="badge fixed">' + item.bugzilla.fixed + '</span></td>' +
        '<td align="center">' + item.level + '</td>' +
        '<td align="right" class="component">' + leaderboard.mostActiveOf(item.components) + '</td>' +
        '</tr>';
    }

    // @TODO: throw this DOM-sorting in the gutter & wash hands...
    // Sort the stats.json data itself, before putting in the DOM.
    $("#list").append(dom);
    leaderboard.sortResults();

  }).fail(function (error) {
    console.log(error);
  });
})();
