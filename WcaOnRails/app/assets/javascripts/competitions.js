$(function() {
  if(document.body.dataset.railsControllerName !== "competitions") {
    return;
  }

  // Hide/show senior delegate select based on what the user's role is.
  var $showPreregForm = $('#competition_showPreregForm');
  $showPreregForm.on("change", function(e) {
    var showPreregForm = this.checked;
    var $seniorDelegateSelect = $('.form-group.competition_showPreregList');
    $seniorDelegateSelect.toggle(!!showPreregForm);
  });
  $showPreregForm.trigger("change");
});
