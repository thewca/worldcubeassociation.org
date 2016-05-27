// Add params from the search fields to the bootstrap-table for on Ajax request.
function queryParams(params) {
  return $.extend(params, {
    region: $('#region').val(),
    search: $('#search').val(),
  });
}

onPage('persons#index', function() {
  var $table = $('.persons-table');

  function reloadPersons() {
    $('#search-box i').removeClass('fa-search').addClass('fa-spinner fa-spin');
    $table.bootstrapTable('refresh');
  }

  $('#region').on('change', reloadPersons);
  $('#search').on('input', _.debounce(reloadPersons, TEXT_INPUT_DEBOUNCE_MS));

  $table.on('load-success.bs.table', function() {
    $('#search-box i').removeClass('fa-spinner fa-spin').addClass('fa-search');
  });
});
