// The application specific JS goes in here

(function () {
  $.ajax({
    url: "stats.json"
  }).done(function (data) {
    console.log(data);
  }).fail(function (error) {
    console.log(error);
  });
})();
