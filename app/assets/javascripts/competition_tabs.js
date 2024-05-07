onPage("competitions#show", function() {
  showTabFromHash();

  $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
    window.location.hash = $(e.target).attr('href');
  });

  // Update the displayed tab when the back/forward is clicked changing the hash.
  $(window).on('hashchange', showTabFromHash);

  function showTabFromHash() {
    var id = window.location.hash || '#general-info';
    $('a[href="' + id + '"]').tab('show');
    $(id).find("iframe").each(function () {
      $iframe = $(this);
      if ($iframe.attr("src") === undefined) {
        $iframe.attr("src", $iframe.data("src"));
      }
    });
    // The FullCalendar implementation that lives inside React (rendered client-side!)
    //   does not go well with the Bootstrap Tabs that are rendered server-side :(
    //   So we "fake" a resize fo React FullCalendar to compute its own dimensions correctly.
    if (id === '#competition-schedule') {
      window.dispatchEvent(new Event('resize'));
    }
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
