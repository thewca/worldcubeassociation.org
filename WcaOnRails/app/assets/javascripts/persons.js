// Add params from the search fields to the bootstrap-table for on Ajax request.
var personsTableAjax = {
  queryParams: function(params) {
    return $.extend(params || {}, {
      region: $('#region').val(),
      search: $('#search').val(),
    });
  },
  doAjax: function(options) {
    return wca.cancelPendingAjaxAndAjax('persons-index', options);
  },
};

onPage('persons#index', function() {
  var $table = $('.persons-table');
  var options = $table.bootstrapTable('getOptions');

  function reloadPersons() {
    $('#search-box i').removeClass('fa-search').addClass('fa-spinner fa-spin');
    options.pageNumber = 1;
    $table.bootstrapTable('refresh');
  }

  $('#region').on('change', reloadPersons);
  $('#search').on('input', _.debounce(reloadPersons, TEXT_INPUT_DEBOUNCE_MS));

  $table.on('load-success.bs.table', function(e, data) {
    $('#search-box i').removeClass('fa-spinner fa-spin').addClass('fa-search');

    // Update params in the url.
    var params = personsTableAjax.queryParams({
      // Extended with region and search params.
      page: options.pageNumber
    });
    var url = location.toString();
    url = url.replace(/persons.*/, 'persons?' + $.param(params));
    history.replaceState(null, null, url);
  });
});
