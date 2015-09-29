$(function() {
  if(document.body.dataset.railsControllerName !== "users") {
    return;
  }

  // Hide/show senior delegate select based on what the user's role is.
  $('select[name="user[delegate_status]"]').on("change", function(e) {
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
  }).trigger("change");

  // Hide/show avatar picker based on if the user is trying to to remove
  // the current avatar.
  $('input#user_remove_avatar').on("change", function(e) {
    var toDelete = e.currentTarget.checked;
    $('.form-group.user_avatar').toggle(!toDelete);
  }).trigger("change");
});
