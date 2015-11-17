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

  var $showPreregFormInput = $('input[name="competition[showPreregForm]"]');
  if($showPreregFormInput.length > 0) {
    var $receiveRegistraionEmailsInput = $('input[name="competition[receive_registration_emails]"]');
    $showPreregFormInput.on("change", function() {
      $receiveRegistraionEmailsInput.parents("div.checkbox").toggle(this.checked);
    }).trigger("change");
  }
});
