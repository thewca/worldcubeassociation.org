onPage("competitions#show", function() {
  showTab(window.location.hash || '#general-info');

  $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
    window.location.hash = $(e.target).attr('href');
  });

  // Update the displayed tab when the back/forward is clicked changing the hash.
  $(window).on('hashchange', function() {
    showTab(window.location.hash);
  });

  function showTab(id) {
    $('a[href="' + id + '"]').tab('show');
  }
});

onPage("competition_tabs#index", function() {
  $('.reorder-up').on('click', function() {
    var $thisRow = $(this).closest('tr');
    $thisRow.prev().before($thisRow);
  });

  $('.reorder-down').on('click', function() {
    var $thisRow = $(this).closest('tr');
    $thisRow.next().after($thisRow);
  });
});
