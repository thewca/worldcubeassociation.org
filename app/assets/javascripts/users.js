onPage('users#edit, users#update', function() {
  // Hide/show avatar picker based on if the user is trying to to remove
  // the current avatar.
  $('input#user_remove_avatar').on("change", function(e) {
    var toDelete = e.currentTarget.checked;
    $('.form-group.user_avatar').toggle(!toDelete);
  }).trigger("change");

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
