onPage('users#edit, users#update', function() {
  // Hide/show senior delegate select based on what the user's role is.
  // This is a copy of def self.delegate_status_requires_senior_delegate(delegate_status) in the user model
  // https://github.com/thewca/worldcubeassociation.org/blob/master/WcaOnRails/app/models/user.rb#L299-L308
  // It is necessary to fix both files for changes to work
  $('select[name="user[delegate_status]"]').on("change", function(e) {
    var delegateStatus = this.value;
    var seniorDelegateRequired = {
      "": false,
      trainee_delegate: true,
      candidate_delegate: true,
      delegate: true,
      senior_delegate: false,
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
    $unconfirmed_wca_id_profile_link.attr('href', "/persons/" + unconfirmed_wca_id);
  });
  $unconfirmed_wca_id.trigger('input');

  // Change the 'section' parameter when a tab is switched.
  $('a[data-toggle="tab"]').on('show.bs.tab', function() {
    var section = $(this).attr('href').slice(1);
    window.wca.setUrlParams({ section: section });
  });
  // Require the user to confirm reading guidelines.
  $('#upload-avatar-form input[type="submit"]').on('click', function(event) {
    var $confirmation = $('#guidelines-confirmation');
    if(!$confirmation[0].checked) {
      event.preventDefault();
      alert($confirmation.data('alert'));
    }
  });

  // Show avatar removal confirmation form
  $(document).ready(function(){
    $('.remove-avatar').click(function(){
      $('.remove-avatar-confirm').show();
    });
  });
});


// Add params from the search fields to the bootstrap-table for on Ajax request.
var usersTableAjax = {
  queryParams: function(params) {
    return $.extend(params || {}, {
      region: $('#region').val(),
      search: $('#search').val(),
    });
  },
  doAjax: function(options) {
    return window.wca.cancelPendingAjaxAndAjax('users-index', options);
  },
};

onPage('users#index', function() {
  var $table = $('.bs-table');
  var options = $table.bootstrapTable('getOptions');
  // Change bootstrap-table pagination description
  options.formatRecordsPerPage = function(pageNumber) {
    // Space after the input box with per page count
    return pageNumber + ' users per page';
  };
  options.formatShowingRows = function(pageFrom, pageTo, totalRows) {
    // Space before the input box with per page count
    return 'Showing ' + pageFrom + ' to ' + pageTo + ' of ' + totalRows + ' users ';
  };

  // Set the table options from the url params.
  var urlParams = window.wca.getUrlParams();
  $.extend(options, {
    pageNumber: parseInt(urlParams.page) || options.pageNumber,
    sortOrder: urlParams.order || options.sortOrder,
    sortName: urlParams.sort || options.sortName
  });
  // Load the data using the options set above.
  $table.bootstrapTable('refresh');

  function reloadUsers() {
    $('#search-box i').removeClass('fa-search').addClass('fa-spinner fa-spin');
    options.pageNumber = 1;
    $table.bootstrapTable('refresh');
  }

  $('#region').on('change', reloadUsers);
  $('#search').on('input', window.wca.lodashDebounce(reloadUsers, window.wca.TEXT_INPUT_DEBOUNCE_MS));

  $table.on('load-success.bs.table', function(e, data) {
    $('#search-box i').removeClass('fa-spinner fa-spin').addClass('fa-search');

    // Update params in the url.
    var params = usersTableAjax.queryParams({
      page: options.pageNumber,
      order: options.sortOrder,
      sort: options.sortName
    });
    window.wca.setUrlParams(params);
  });
});
