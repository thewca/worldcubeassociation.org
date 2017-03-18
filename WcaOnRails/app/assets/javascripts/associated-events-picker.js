$(function() {
  function checkboxesSetter(value) {
    return function() {
      $(this).closest('.form-group').find('.event-checkbox input[type="checkbox"]').prop('checked', value);
    };
  }

  $('.select-all-events').on('click', checkboxesSetter(true));
  $('.clear-all-events').on('click', checkboxesSetter(false));
});
