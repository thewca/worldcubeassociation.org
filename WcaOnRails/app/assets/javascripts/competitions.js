onPage('competitions#new', function() {
  var $competitionSelect = $('#competition_competition_id_to_clone');
  if($competitionSelect.length > 0) {
    var selectize = $competitionSelect[0].selectize;

    var competitionChanged = function() {
      var competitionId = selectize.getValue();
      var enteredCompetitionId = selectize.$control_input.val();
      var $createCompetition = $('#create-competition');
      $createCompetition.text((enteredCompetitionId || competitionId) ? "Clone competition" : "Create competition");
      // If they entered something into the competition field, but have not
      // actually selected a competition, then disable the clone competition button.
      $createCompetition.prop("disabled", enteredCompetitionId && !competitionId);
    };
    competitionChanged();

    selectize.on("change", competitionChanged);
    selectize.$control_input.on("input", competitionChanged);
  }
});

onPage('competitions#edit', function() {
  var $useWcaRegistrationInput = $('input[name="competition[use_wca_registration]"]');
  if($useWcaRegistrationInput.length > 0) {
    var $registrationOptionsAreas = $('.wca-registration-options');
    $useWcaRegistrationInput.on("change", function() {
      $registrationOptionsAreas.toggle(this.checked);
    }).trigger("change");
  }
});


// Initializes the competitions map and marker cluster.
function initializeCompetitionsMap() {
  competitionsMap = new google.maps.Map(document.getElementById('competitions-map'), {
    zoom: 2,
    center: {lat: 0, lng: 0},
    scrollwheel: true
  });

  competitionsMarkerCluster = new MarkerClusterer(competitionsMap, [], {
    maxZoom: 10,
    clusterSize: 30
  });
}

// Sets map container height.
function resizeMapContainer() {
  var formHeight = $('#comp-query-form').outerHeight(true);
  var footerHeight = $('.footer').outerHeight(true);
  var viewHeight = $(window).innerHeight();
  var mapHeight = viewHeight - footerHeight - formHeight;

  if(mapHeight < 300) {
    mapHeight = 300;
  }
  $('#competitions-map').height(mapHeight);
}

onPage('competitions#index', function() {
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
  $form = $('#comp-query-form');
  function submitForm() {
    $form.trigger('submit.rails');
  }

  $form.on('change', 'input[type="checkbox"], select', submitForm)
       .on('input', 'input[type="text"]', _.debounce(submitForm, TEXT_INPUT_DEBOUNCE_MS))
       .on('click', '#clear-all-events, #select-all-events', submitForm)
       .on('click', '#present, .years .year a', submitForm)
       .on('change', '#display', submitForm);

  $('#comp-query-form').on('ajax:send', function() {
    $('#loading').show();
  });

  $('#comp-query-form').on('ajax:complete', function() {
    $('#loading').hide();

    // Scroll to the top of the form if we are in map mode and screen width is greater than 800px
    if($('#competitions-map').is(':visible') && $(window).innerWidth() > 800) {
      var formTop = $('#comp-query-form').offset().top;
      $('html, body').animate({ scrollTop: formTop - 5 }, 300);
    }
  });

  // Reaload the page when back/forward is clicked.
  $(window).on('popstate', function() {
    location.reload();
  });
});
