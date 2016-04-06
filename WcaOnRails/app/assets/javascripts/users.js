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

  var $approve_wca_id = $('#approve-wca-id');
  var $unconfirmed_wca_id = $("#user_unconfirmed_wca_id");
  var $unconfirmed_wca_id_profile_link = $("a#unconfirmed-wca-id-profile");
  $approve_wca_id.on("click", function(e) {
    $("#user_wca_id").val($unconfirmed_wca_id.val());
    $unconfirmed_wca_id.val('');
    $unconfirmed_wca_id.trigger('input');
  });
  $unconfirmed_wca_id.on("input", function(e) {
    var unconfirmed_wca_id = $unconfirmed_wca_id.val();
    $approve_wca_id.prop("disabled", !unconfirmed_wca_id);
    $unconfirmed_wca_id_profile_link.parent().toggle(!!unconfirmed_wca_id);
    $unconfirmed_wca_id_profile_link.attr('href', "/results/p.php?i=" + unconfirmed_wca_id);
  });
  $unconfirmed_wca_id.trigger('input');

  // Change bootstrap-table pagination description
  var $table = $('.bootstrap-table');
  var options = $table.bootstrapTable('getOptions');
  options.formatRecordsPerPage = function(pageNumber) {
    // Space after the input box with per page count
    return pageNumber + ' users per page';
  };
  options.formatShowingRows = function(pageFrom, pageTo, totalRows) {
    // Space before the input box with per page count
    return 'Showing ' + pageFrom + ' to ' + pageTo + ' of ' + totalRows + ' users ';
  };
});
