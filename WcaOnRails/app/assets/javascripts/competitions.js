
$(function() {
  if(document.body.dataset.railsControllerName !== "competitions") {
    return;
  }

  var $competitionSelect = $('#competition_competition_id_to_clone');
  if($competitionSelect.length > 0) {
    var competitionChanged = function() {
      var competitionId = $competitionSelect.val();
      $('.new-competition button[type=submit]').text(competitionId ? "Clone competition" : "Create competition");
    };
    competitionChanged();

    $competitionSelect.on("typeahead:select", competitionChanged);
    $competitionSelect.on("input", competitionChanged);
  }
});
