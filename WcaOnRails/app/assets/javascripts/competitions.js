$(function() {
  if(document.body.dataset.railsControllerName !== "competitions") {
    return;
  }

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

  var $useWcaRegistrationInput = $('input[name="competition[use_wca_registration]"]');
  if($useWcaRegistrationInput.length > 0) {
    var $registrationOptionsAreas = $('.wca-registration-options');
    $useWcaRegistrationInput.on("change", function() {
      $registrationOptionsAreas.toggle(this.checked);
    }).trigger("change");
  }

  $('#clear-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', false);
  });
  $('#select-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', true);
  });
});
