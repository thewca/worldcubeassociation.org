onPage('admin#edit_person, admin#update_person', function() {
  var $personFields = $('#person-fields :input');

  $('#person_wca_id').on('change', function() {
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
});
