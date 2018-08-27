onPage('contacts#fix_personal_information, contacts#fix_personal_information_create', function() {
  $('#fix_personal_information_contact_wca_id').on('change', function() {
    // Update person wca id in the url.
    var personWcaId = $('#fix_personal_information_contact_wca_id').val();
    if(personWcaId !== '') {
      $.setUrlParams({ 'fix_personal_information_contact[wca_id]': personWcaId });
    }

    // Clear or fill all the other fields.
    var $personFields = $('#person-fields :input');
    if(personWcaId === '') {
      $personFields.attr('disabled', true);
      $personFields.not('[type="submit"]').val('');
    } else {
      wca.cancelPendingAjaxAndAjax('grab_person_data', {
        url: '/api/v0/users/' + personWcaId,
        success: function(data) {
          var user = data.user;
          $personFields.attr('disabled', false);
          $("#fix_personal_information_contact_name").val(user.name);
          $("#fix_personal_information_contact_gender").val(user.gender);
        }
      });
    }
  });

  // When the page is ready, disable the appropriate fields if the form is empty and normalize the url.
  $('#fix_personal_information_contact_wca_id').trigger('change');
});
