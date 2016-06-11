onPage("competitions#show", function() {
  var hash = window.location.hash;
  if(hash === "") {
    hash = '#general-info';
  }
  $('a[href="' + hash + '"]').tab('show');

  $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
    window.location.hash = $(e.target).attr('href');
  });
});
