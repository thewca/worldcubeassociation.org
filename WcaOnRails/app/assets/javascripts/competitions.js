$(function() {
  if(document.body.dataset.railsControllerName !== "competitions") {
    return;
  }

  var $competitionSelect = $('#competition_competition_id_to_clone');
  if($competitionSelect.length > 0) {
    var competitionChanged = function() {
      var competitionId = $competitionSelect.val();
      $('#create-competition').text(competitionId ? "Clone competition" : "Create competition");
    };
    competitionChanged();

    $competitionSelect.on("typeahead:select", competitionChanged);
    $competitionSelect.on("input", competitionChanged);
  }

  var $useWcaRegistrationInput = $('input[name="competition[use_wca_registration]"]');
  if($useWcaRegistrationInput.length > 0) {
    var $registrationOptionsAreas = $('.wca-registration-options');
    $useWcaRegistrationInput.on("change", function() {
      $registrationOptionsAreas.toggle(this.checked);
    }).trigger("change");
  }
});
