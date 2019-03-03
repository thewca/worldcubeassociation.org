onPage('admin#edit_person, admin#update_person', function() {

  $('#person_wca_id').on('change', function() {
    // Update person wca id in the url.
    var personWcaId = $('#person_wca_id').val();
    if(personWcaId !== '') {
      $.setUrlParams({ 'person[wca_id]': personWcaId });
    }

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
          /* Unfocus person select once the data is loaded, so the autocomplete doesn't show up on browser tab change. */
          $('.person_wca_id .selectize-control input').blur();
        }
      });
    }
  });

  // When the page is ready, disable the appropriate fields if the form is empty and normalize the url.
  $('#person_wca_id').trigger('change');
});
