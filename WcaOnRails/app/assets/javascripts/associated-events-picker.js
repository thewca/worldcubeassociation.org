$(function() {
  function checkboxesSetter(value) {
    return function() {
      var $eventsFormGroup = $(this).closest('.form-group');
      $eventsFormGroup.find('.event-checkbox input[type="checkbox"]').prop('checked', value);
      updateEventsInformation($eventsFormGroup);
    };
  }

  $('.select-all-events').on('click', checkboxesSetter(true));
  $('.clear-all-events').on('click', checkboxesSetter(false));

  function updateEventsInformation($eventsFormGroup) {
    checked = $eventsFormGroup.find('input[type="checkbox"]:checked');
    var checkedLength = checked.length;

    if (document.getElementById('per-event-fees')) {
      baseFee = $('#per-event-fees').data('base-fee');
      fees = $('#per-event-fees').data('fees');
      var feeLength = fees.length;

      var totalFee = baseFee;
      for (var i = 0; i < checkedLength; i++) {
        for (var j = 0; j < feeLength; j++) {
          if (fees[j].event_id == checked[i].dataset.event) {
            totalFee += fees[j].fee_lowest_denomination;
          }
        }
      }
      document.getElementById("entry-fee-display").textContent = totalFee;
    }

    var count = $eventsFormGroup.find('input[type="checkbox"]:checked').size();
    var $eventsSelectedCount = $eventsFormGroup.find('.associated-events-label .events-selected-count');
    $eventsSelectedCount.text(count);
  }

  $('.associated-events').on('change', function(e) {
    updateEventsInformation($(this).closest('.form-group'));
  }).trigger('change');
});
