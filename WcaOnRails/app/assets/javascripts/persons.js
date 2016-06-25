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

  // Set pagination page from params.
  var pageNumber = $.getUrlParam('page');
  if(pageNumber) {
    $table.bootstrapTable('refreshOptions', { pageNumber: parseInt(pageNumber) });
  }

  function reloadPersons() {
    $('#search-box i').removeClass('fa-search').addClass('fa-spinner fa-spin');

    $table.bootstrapTable('getOptions').pageNumber = 1;

    $table.bootstrapTable('refresh');
  }

  $('#region').on('change', reloadPersons);
  $('#search').on('input', _.debounce(reloadPersons, TEXT_INPUT_DEBOUNCE_MS));

  $table.on('load-success.bs.table', function(e, data) {
    $('#search-box i').removeClass('fa-spinner fa-spin').addClass('fa-search');

    // Update params in the url.
    var params = personsTableAjax.queryParams(); // Get region and search params.
    params.page = $table.bootstrapTable('getOptions').pageNumber;
    var url = location.toString();
    url = url.replace(/persons.*/, 'persons?' + $.param(params));
    history.replaceState(null, null, url);
  });
});
