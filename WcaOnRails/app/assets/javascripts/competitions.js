onPage('competitions#edit, competitions#update, competitions#admin_edit, competitions#new, competitions#create, competitions#clone_competition', function() {
  $('input[name="competition[generate_website]"]').on('change', function() {
    var generateWebsite = this.checked;
    $('div.competition_external_website').toggle(!generateWebsite);
    $('input#competition_external_website').prop('disabled', generateWebsite);
  }).trigger('change');

  $('input[name="competition[use_wca_registration]"]').on('change', function() {
    var registrationWca = this.checked;
    $('.wca-registration-options').toggle(registrationWca);
    $('.competition_external_registration_page').toggle(!registrationWca);
  }).trigger('change');

  $('input[name="competition[guests_entry_fee_lowest_denomination]"]').on('change', function() {
    $('.guest-no-entry-fee-options').toggle(this.value === "0");
  }).trigger('change');

  $('select[name="competition[competitor_limit_enabled]"]').on('change', function() {
    $('.wca-competitor-limit-options').toggle(this.value === "true");
  }).trigger('change');

  $('select[name="competition[on_the_spot_registration]"]').on('change', function() {
    $('.competition_on_the_spot_entry_fee_lowest_denomination').toggle(this.value === "true");
  }).trigger('change');

  $('input[name="competition[early_puzzle_submission]"]').on('change', function() {
    $('.competition_early_puzzle_submission_reason').toggle(this.checked);
  }).trigger('change');

  $('input[name="competition[qualification_results]"]').on('change', function() {
    $('.competition_qualification_results_reason').toggle(this.checked);
    $('.competition_allow_registration_without_qualification').toggle(this.checked);
  }).trigger('change');

  $('input[name="competition[event_restrictions]"]').on('change', function() {
    $('.competition_event_restrictions_reason').toggle(this.checked);
  }).trigger('change');

  $('input[name="competition[refund_policy_limit_date]"]').on('change dp.change', function() {
    if($('input[name="competition[waiting_list_deadline_date]"]').val() === "") {
      $('input[name="competition[waiting_list_deadline_date]"]').val(this.value);
    }
  }).trigger('change');

  $('.adjacent-competitions').on('click', "#wca-adjacent-competitions-show-events-button", function() {
    $('.adjacent-competitions .wca-adjacent-competitions-show-events').show();
    $('.adjacent-competitions .wca-adjacent-competitions-hide-events').hide();
  });

  $('.adjacent-competitions').on('click', "#wca-adjacent-competitions-hide-events-button", function() {
    $('.adjacent-competitions .wca-adjacent-competitions-show-events').hide();
    $('.adjacent-competitions .wca-adjacent-competitions-hide-events').show();
  });

  $('select[name="competition[guest_entry_status]"]').on('change', function() {
    $('.competition_guests_per_registration_limit').toggle(this.value === 'restricted');
  }).trigger('change');

  // the forms library we're using is built for 1-to-many associations. So when deleting an existing
  // Series, it simply adds another new Series entry on top of that, which our 1-on-1 association
  // cannot handle correctly. As a remedy, we force the user to save first by displaying a hint.
  $('.series .remove_fields.existing').on('click', 'button', function() {
    $('.series .save-first-hint').show();
    $('.series a.add_fields').hide();
  });
});

// Sets map container height.
function resizeMapContainer() {
  var formHeight = $('#competition-query-form').outerHeight(true);
  var footerHeight = $('.footer').outerHeight(true);
  var viewHeight = $(window).innerHeight();
  var mapHeight = viewHeight - footerHeight - formHeight;

  mapHeight = Math.max(300, mapHeight);

  $('#competitions-map').height(mapHeight);
}

onPage('competitions#index', function() {
  resizeMapContainer();
  $(window).on('resize', resizeMapContainer);

  // Bind all/clear cubing event buttons
  $('#clear-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', false);
  });
  $('#select-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', true);
  });

  // Ajax searching
  var $form = $('#competition-query-form');
  function submitForm() {
    $form.trigger('submit.rails');
  }

  $form.on('change', '#events, #region, #state, #display, #status, #delegate, #cancelled, #registration-status', submitForm)
       .on('click', '#clear-all-events, #select-all-events', submitForm)
       .on('input', '#search', window.wca.lodashDebounce(submitForm, window.wca.TEXT_INPUT_DEBOUNCE_MS))
       .on('dp.change','#from_date, #to_date', submitForm);

  $('#competition-query-form').on('ajax:send', function() {
    $('#loading').show();
  });

  $('#competition-query-form').on('ajax:complete', function() {
    $('#loading').hide();

    // Scroll to the top of the form if we are in map mode and screen width is greater than 800px
    if($('#competitions-map').is(':visible')) {
      // Switching between list/map/admin uses AJAX to load the map element,
      // unfortunately it does not trigger our iframe resize trick...
      // Google maps somehow did make this work, so if you're motivated,
      // you could look at their source code to try to figure out how they detect and handle this situation.
      window.wca._competitionsIndexMap.invalidateSize();
      if ($(window).innerWidth() > 800) {
        var formTop = $('#competition-query-form').offset().top;
        $('html, body').animate({ scrollTop: formTop - 5 }, 300);
      }
    }
  });

  // Necessary hack because Safari fires a popstate event on document load
  $(window).on('load', function() {
    setTimeout(function() {
      // When back/forward is clicked the url changes since we use pushState,
      // but the content is not reloaded so we have to do this manually.
      $(window).on('popstate', function() {
        location.reload();
      });
    }, 0);
  });
});
