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


// Creates the competitions map and marker cluster if they don't already exist. Returns the map.
function getCompetitionsMap() {
  if(wca.competitionsMap === undefined) {
    wca.competitionsMap = new google.maps.Map(document.getElementById('competitions-map'), {
      zoom: 2,
      center: {lat: 0, lng: 0},
      scrollwheel: true,
    });

    wca.competitionsMarkerCluster = new MarkerClusterer(wca.competitionsMap, [], {
      maxZoom: 10,
      clusterSize: 30,
    });
  }

  return wca.competitionsMap;
}

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

  $form.on('change', '#events, #region, #state, #display', submitForm)
       .on('click', '#clear-all-events, #select-all-events', submitForm)
       .on('input', '#search', _.debounce(submitForm, TEXT_INPUT_DEBOUNCE_MS));

  $('#competition-query-form').on('ajax:send', function() {
    $('#loading').show();
  });

  $('#competition-query-form').on('ajax:complete', function() {
    $('#loading').hide();

    // Scroll to the top of the form if we are in map mode and screen width is greater than 800px
    if($('#competitions-map').is(':visible') && $(window).innerWidth() > 800) {
      var formTop = $('#competition-query-form').offset().top;
      $('html, body').animate({ scrollTop: formTop - 5 }, 300);
    }
  });

  // Reaload the page when back/forward is clicked.
  $(window).on('popstate', function() {
    location.reload();
  });
});
