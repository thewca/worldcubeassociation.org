onPage('admin#edit_person, admin#update_person', function() {

  $('#person_wca_id').on('change', function() {
    // Update person wca id in the url.
    var currentUrl = location.toString();
    var personWcaId = $('#person_wca_id').val();
    var newUrl = currentUrl.replace(/admin.*/, 'admin/edit_person');
    if(personWcaId !== '') {
      newUrl +='?person[wca_id]=' + personWcaId;
    }
    history.replaceState(null, null, newUrl);

    // Clear or fill all the other fields.
    var $personFields = $('#person-fields :input');
    if($(this).val() === '') {
      $personFields.attr('disabled', true);
      $personFields.not('[type="submit"]').val('');
    } else {
      $personFields.attr('disabled', false);
      wca.cancelPendingAjaxAndAjax('grab_person_data', {
        url: '/admin/person_data',
        data: {
          'person_wca_id': $(this).val(),
        },
        success: function(data) {
          $.each(data, function(attribute, value) {
            $('#person_' + attribute).val(value);
            if(attribute === 'dob') {
              $('#person_dob').data("DateTimePicker").date(value);
            }
          });
        }
      });
    }
  });

  // When the page is ready, disable the appropriate fields if the form is empty and normalize the url.
  $('#person_wca_id').trigger('change');
});
