
// Add params from the search fields to the bootstrap-table for on Ajax request.
var personsTableAjax = {
  queryParams: function(params) {
    if (personsTableAjax.queriesOK !== true) {
      return false; // Stop Bootstrap Table's uncontrollable initial load
    }

    return $.extend(params || {}, {
      region: $('#region').val(),
      search: $('#search').val(),
    });
  },
  doAjax: function(options) {
    $('.pagination li').addClass('disabled');
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

  // Set the table options from the url params.
  options.pageNumber = parseInt($.getUrlParams().page) || options.pageNumber;
  // Load the data using the options set above.
  personsTableAjax.queriesOK = true;
  $table.bootstrapTable('refresh');

  $('#region').on('change', reloadPersons);
  $('#search').on('input', _.debounce(reloadPersons, TEXT_INPUT_DEBOUNCE_MS));

  $table.on('load-success.bs.table', function(e, data) {
    $('#search-box i').removeClass('fa-spinner fa-spin').addClass('fa-search');

    // Update params in the url.
    var params = personsTableAjax.queryParams({
      // Extended with region and search params.
      page: options.pageNumber
    });
    $.setUrlParams(params);
  });
});

onPage('persons#show', function() {
  /* Handle events selector for results by event. */
  $('.event-selector input[type="radio"]').on('change', function() {
    var eventId = $(this).val();
    var $tbodies = $('.results-by-event table tbody');
    $tbodies.hide();
    $tbodies.filter('.event-' + eventId).show();
    $('.results-by-event table').trigger('resize'); /* Let the table recalculate all widths. */
    $.setUrlParams({ event:  eventId });
  });
  $('.event-selector input[type="radio"][checked="checked"]').trigger('change');

  var currentTab = $.getUrlParams().tab || 'results-by-event';
  $('a[href="#' + currentTab + '"]').tab('show');

  $('a[data-toggle="tab"]').on('shown.bs.tab', function() {
    var tab = $(this).attr('href').slice(1);
    if(tab === 'map') {
      /* Google Map is not properly initialized within a hidden container. */
      google.maps.event.trigger($('#competitions-map')[0], 'resize');
    }
    $.setUrlParams({ tab: tab });

    var top = $(this).offset().top;
    $('html, body').animate({ scrollTop: top - 5 });
  });
});
