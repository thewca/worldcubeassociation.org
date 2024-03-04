$(function() {
  function checkboxesSetter(value) {
    return function() {
      var $eventsFormGroup = $(this).closest('.form-group');
      $eventsFormGroup.find('.event-checkbox input[type="checkbox"]').prop('checked', value);
      updateEventsSelectedCount($eventsFormGroup);
    };
  }

  $('.select-all-events').on('click', checkboxesSetter(true));
  $('.clear-all-events').on('click', checkboxesSetter(false));

  function updateEventsSelectedCount($eventsFormGroup) {
    var count = $eventsFormGroup.find('input[type="checkbox"]:checked').length;
    var $eventsSelectedCount = $eventsFormGroup.find('.associated-events-label .events-selected-count');
    $eventsSelectedCount.text(count);
  }

  $('.associated-events').on('change', function(e) {
    updateEventsSelectedCount($(this).closest('.form-group'));
  }).trigger('change');
});
