// Sets map container height.
function resizeMapContainer() {
  var formHeight = $('#competition-query-form').outerHeight(true);
  var footerHeight = $('.footer').outerHeight(true);
  var viewHeight = $(window).innerHeight();
  var mapHeight = viewHeight - footerHeight - formHeight;

  mapHeight = Math.max(300, mapHeight);

  $('#competitions-map').height(mapHeight);
}

onPage('competitions#index', function() {
  var queryParams = new URLSearchParams(window.location.search);
  if (queryParams.get('legacy') === 'off') return;

  resizeMapContainer();
  $(window).on('resize', resizeMapContainer);

  // Bind all/clear cubing event buttons
  $('#clear-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', false);
  });
  $('#select-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', true);
  });

  // Ajax searching
  var $form = $('#competition-query-form');
  function submitForm() {
    $form.trigger('submit.rails');
  }

  $form.on('change', '#events, #region, #state, #display, #status, #delegate, #cancelled, #registration-status', submitForm)
       .on('click', '#clear-all-events, #select-all-events', submitForm)
       .on('input', '#search', window.wca.lodashDebounce(submitForm, window.wca.TEXT_INPUT_DEBOUNCE_MS))
       .on('dp.change','#from_date, #to_date', submitForm);

  $('#competition-query-form').on('ajax:send', function() {
    $('#loading').show();
  });

  $('#competition-query-form').on('ajax:complete', function() {
    $('#loading').hide();

    // Scroll to the top of the form if we are in map mode and screen width is greater than 800px
    if($('#competitions-map').is(':visible')) {
      // Switching between list/map/admin uses AJAX to load the map element,
      // unfortunately it does not trigger our iframe resize trick...
      // Google maps somehow did make this work, so if you're motivated,
      // you could look at their source code to try to figure out how they detect and handle this situation.
      window.wca._competitionsIndexMap.invalidateSize();
      if ($(window).innerWidth() > 800) {
        var formTop = $('#competition-query-form').offset().top;
        $('html, body').animate({ scrollTop: formTop - 5 }, 300);
      }
    }
  });

  // Necessary hack because Safari fires a popstate event on document load
  $(window).on('load', function() {
    setTimeout(function() {
      // When back/forward is clicked the url changes since we use pushState,
      // but the content is not reloaded so we have to do this manually.
      $(window).on('popstate', function() {
        location.reload();
      });
    }, 0);
  });
});
