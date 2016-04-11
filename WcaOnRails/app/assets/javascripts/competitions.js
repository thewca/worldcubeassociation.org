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

onPage('competitions#index', function() {
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
    $('#search-results').hide();
    $('#loading').show();
  });

  $('#comp-query-form').on('ajax:complete', function() {
    $('#loading').hide();
    $('#search-results').show();
  });

  // Reaload the page when back/forward is clicked.
  $(window).on('popstate', function() {
    location.reload();
  });
});
