onPage('users#edit, users#update', () => {
  // Hide/show avatar picker based on if the user is trying to to remove
  // the current avatar.
  $('input#user_remove_avatar').on('change', (e) => {
    const toDelete = e.currentTarget.checked;
    $('.form-group.user_avatar').toggle(!toDelete);
  }).trigger('change');

  const $approve_wca_id = $('#approve-wca-id');
  const $unconfirmed_wca_id = $('#user_unconfirmed_wca_id');
  const $unconfirmed_wca_id_profile_link = $('a#unconfirmed-wca-id-profile');
  $approve_wca_id.on('click', (e) => {
    $('#user_wca_id').val($unconfirmed_wca_id.val());
    $unconfirmed_wca_id.val('');
    $unconfirmed_wca_id.trigger('input');
  });
  $unconfirmed_wca_id.on('input', (e) => {
    const unconfirmed_wca_id = $unconfirmed_wca_id.val();
    $approve_wca_id.prop('disabled', !unconfirmed_wca_id);
    $unconfirmed_wca_id_profile_link.parent().toggle(!!unconfirmed_wca_id);
    $unconfirmed_wca_id_profile_link.attr('href', `/persons/${unconfirmed_wca_id}`);
  });
  $unconfirmed_wca_id.trigger('input');

  // Change the 'section' parameter when a tab is switched.
  $('a[data-toggle="tab"]').on('show.bs.tab', function () {
    const section = $(this).attr('href').slice(1);
    window.wca.setUrlParams({ section });
  });
  // Require the user to confirm reading guidelines.
  $('#upload-avatar-form input[type="submit"]').on('click', (event) => {
    const $confirmation = $('#guidelines-confirmation');
    if (!$confirmation[0].checked) {
      event.preventDefault();
      alert($confirmation.data('alert'));
    }
  });

  // Show avatar removal confirmation form
  $(document).ready(() => {
    $('.remove-avatar').click(() => {
      $('.remove-avatar-confirm').show();
    });
  });
});
