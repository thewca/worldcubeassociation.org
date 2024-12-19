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
