$(document).on("page:change", function() {
  if(document.body.dataset.railsControllerName !== "users") {
    return;
  }

  // Hide/show senior delegate select based on what the user's role is.
  var $delegateStatus = $('select[name="user[delegate_status]"]');
  $delegateStatus.on("change", function(e) {
    var delegateStatus = this.value;
    var seniorDelegateRequired = {
      "": false,
      candidate_delegate: true,
      delegate: true,
      senior_delegate: false,
      board_member: false,
    }[delegateStatus];

    var $seniorDelegateSelect = $('.form-group.user_senior_delegate');
    $seniorDelegateSelect.toggle(seniorDelegateRequired);

    var $userRegionInput = $('.form-group.user_region');
    $userRegionInput.toggle(!!delegateStatus);
  });
  $delegateStatus.trigger("change");
});
