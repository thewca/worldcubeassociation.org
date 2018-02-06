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
    var checkedEvents = $eventsFormGroup.find('input[type="checkbox"]:checked');
    var count = checkedEvents.size();
    var $eventsSelectedCount = $eventsFormGroup.find('.associated-events-label .events-selected-count');
    $eventsSelectedCount.text(count);

    var eventIds = [];
    for (var i = 0; i < count; i++) {
      eventIds.push(checkedEvents[i].dataset.event);
    }

    wca.cancelPendingAjaxAndAjax('render_entry_fee_for_selected_events', {
      url: 'registrations/event_fee_for_selected_events',
      data: {
        'eventIds': eventIds,
      },
      success: function(data) {
        $('.dynamic-entry-fee').html(data.html);
      }
    });
  }

  $('.associated-events').on('change', function(e) {
    updateEventsInformation($(this).closest('.form-group'));
  }).trigger('change');
});
