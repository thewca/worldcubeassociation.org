onPage('admin#edit_person, admin#update_person', function() {

  $('#person_wca_id').on('change', function() {
    // Update person wca id in the url.
    var personWcaId = $('#person_wca_id').val();
    if(personWcaId !== '') {
      window.wca.setUrlParams({ 'person[wca_id]': personWcaId });
    }

    // Clear or fill all the other fields.
    var $personFields = $('#person-fields :input');
    if($(this).val() === '') {
      $personFields.attr('disabled', true);
      $personFields.not('[type="submit"]').val('');
    } else {
      $personFields.attr('disabled', false);
      window.wca.cancelPendingAjaxAndAjax('grab_person_data', {
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

onPage('admin#add_new_result, admin#do_add_new_result', function() {

  // Toggle between new and returning competitor should hide / show fields relating to the competitor
  $('#add_new_result_is_new_competitor').on('change', function() {
    if (this.checked) {
      $('.add_new_result_competitor_id').hide();
      $('.new-person-fields').show();
    } else {
      $('.add_new_result_competitor_id').show();
      $('.new-person-fields').hide();
    }
  }).trigger('change');

  // When Competition is selected, enable event field with appropriate events
  var lastCompetitionId;
  $('#add_new_result_competition_id').on('change', function() {
    var selectEvent = $('#add_new_result_event_id');
    var selectRound = $('#add_new_result_round_id');
    var competitionId = this.value;
    if (competitionId === '') {
      // clear and disable event, round, and value inputs
      selectEvent.val('');
      selectEvent.prop('disabled', true);
      selectRound.val('');
      selectRound.prop('disabled', true);
      $('.value-fields :input').attr('disabled', true);
    } else if (lastCompetitionId !== competitionId) {
      // grab competition data
      window.wca.cancelPendingAjaxAndAjax('grab_competition_data', {
        url: '/admin/competition_data',
        data: { competition_id: competitionId },
        success: function(competitionData) {
          // Enable events field and remove previous options
          selectEvent.prop('disabled', false);
          var selectedEventValue = selectEvent.val();
          selectEvent.find('option').remove();
          // set up appropriate events in select menu based on competition selected
          $("<option>", { value: '', text: '' }).appendTo(selectEvent);
          for (var i=0; i < competitionData.events.length; i++) {
            $("<option>", { value: competitionData.events[i].id, text: competitionData.events[i].name }).appendTo(selectEvent);
          }
          // for the first load of the forum, some values may already be filled in (ie. when reciving a validation error)
          // and we should maintain the value of selected event, otherwise when the competition changes, the event selected should be cleared
          if (!lastCompetitionId) {
            selectEvent.val(selectedEventValue);
            selectEvent.trigger('change');
          } else {
            selectEvent.val('');
          }
          lastCompetitionId = competitionId;
        }
      });
    }
  }).trigger('change');

  // When Event is selected, enable round field with appropriate rounds relative to the event
  var lastEventId;
  $('#add_new_result_event_id').on('change', function() {
    var eventValue = this.value;
    var selectRound = $('#add_new_result_round_id');
    if (eventValue === '') {
      // clear and disable round and value inputs
      selectRound.val('');
      selectRound.prop('disabled', true);
      $('.value-fields :input').attr('disabled', true);
    } else {
      // grab competition data
      window.wca.cancelPendingAjaxAndAjax('grab_competition_data', {
        url: '/admin/competition_data',
        data: { competition_id: $('#add_new_result_competition_id').val() },
        success: function(competitionData) {
          // Enable round field and remove previous options
          selectRound.prop('disabled', false);
          var selectedRoundValue = selectRound.val();
          selectRound.find('option').remove();
          // set up appropriate rounds in select menu based on competition and event selected
          $("<option>", {value: '', text: ''}).appendTo(selectRound);
          var competitionEventId = competitionData.competition_events.find(event => event.event_id === eventValue).id;
          var rounds = competitionData.rounds.filter(round => round.competition_event_id === competitionEventId);
          for (var i=0; i < rounds.length; i++) {
            $("<option>", {value: rounds[i].id, text: rounds[i].number}).appendTo(selectRound);
          }
          // for the first load of the forum, some values may already be filled in (ie. when reciving a validation error)
          // and we should maintain the value of selected round, otherwise when the event changes, the round selected should be cleared
          if (!lastEventId) {
            selectRound.val(selectedRoundValue);
            selectRound.trigger('change')
          } else {
            selectRound.val('');
          }
          lastEventId = eventValue;
        }
      });
    }
  });

  // When Round is selected, enable value fields
  $('#add_new_result_round_id').on('change', function() {
    if (this.value === '') {
      $('.value-fields :input').attr('disabled', true);
    } else {
      $('.value-fields :input').attr('disabled', false);
    }
  });

  // autofill semi_id whenever both the competition and name have been filled in
  function autofillSemiId(name, competition_id) {
    // the semi_id is constructed like YYYYAAAA
    // where YYYY is the year of the first competition of the competitor. In this case, the new competitor being created will have their first results at the competition specified.
    // AAAA is the first 4 characters of the lastest name. If the lastest name is too shot (<4) then the first part of the name will be used.
    // There may be a name like "Phi" in which there arent enough letters to complete the WCAID. We append U as padding (same as in persons_finish_unfinished.php).
    var names = name.split(" ");
    var namePartOfId = names[names.length - 1].slice(0, 4);
    if (namePartOfId.length < 4 && names.length > 1) {
      namePartOfId += names.join("").slice(0, 4 - namePartOfId.length);
    }
    if (namePartOfId.length < 4) {
      namePartOfId += "UUUU".slice(0, 4 - namePartOfId.length);
    }
    var competitionYear = competition_id.slice(-4);
    if (!isNaN(competitionYear)) {
      $('#add_new_result_semi_id').val(competitionYear + namePartOfId.toUpperCase());
    }
  }
  $('#add_new_result_name').on('change', function() {
    if (this.value && $('#add_new_result_competition_id').val() && !$('#add_new_result_semi_id').val()) {
      autofillSemiId(this.value, $('#add_new_result_competition_id').val());
    }
  });
  $('#add_new_result_competition_id').on('change', function() {
    if (this.value && $('#add_new_result_name').val() && !$('#add_new_result_semi_id').val()) {
      autofillSemiId($('#add_new_result_name').val(), this.value);
    }
  });

});
