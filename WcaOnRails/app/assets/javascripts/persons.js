// Add params from the search fields to the bootstrap-table for on Ajax request.
var personsTableAjax = {
  queryParams: function(params) {
    return $.extend(params, {
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

  function reloadPersons() {
    $('#search-box i').removeClass('fa-search').addClass('fa-spinner fa-spin');

    var url = location.toString();
    // Get region and search params.
    var params = $.param(personsTableAjax.queryParams({}));
    url = url.replace(/persons.*/, 'persons?' + params);
    history.replaceState(null, null, url);

    $table.bootstrapTable('refresh');
  }

  $('#region').on('change', reloadPersons);
  $('#search').on('input', _.debounce(reloadPersons, TEXT_INPUT_DEBOUNCE_MS));

  $table.on('load-success.bs.table', function(e, data) {
    $('#search-box i').removeClass('fa-spinner fa-spin').addClass('fa-search');
  });
});
