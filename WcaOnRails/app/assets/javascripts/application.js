// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require bootstrap-sprockets
//= require bootstrap-hover-dropdown
//= require local_time
//= require wice_grid
//= require jquery.are-you-sure
//= require locationpicker.jquery
//= require underscore
//= require selectize
//= require selectize.do_not_clear_on_blur
//= require jquery.jcrop
//= require lodash
//= require jquery.wca-autocomplete
//= require jquery.floatThead-slim.js
//= require cocoon
//= require moment
//= require bootstrap-datetimepicker
//= require jquery.tabbable
//= require_self
//= require_tree .


// Dumping ground for... stuff
window.wca = window.wca || {};

wca._pendingAjaxById = {};
wca.cancelPendingAjaxAndAjax = function(id, options) {
  if(wca._pendingAjaxById[id]) {
    wca._pendingAjaxById[id].abort();
  }
  wca._pendingAjaxById[id] = $.ajax(options).always(function() {
    delete wca._pendingAjaxById[id];
  });
  return wca._pendingAjaxById[id];
};

$(function() {
  $('.dropdown-toggle').dropdownHover();
  $('form.are-you-sure').areYouSure();

  // Copied (and modified by jfly) from
  // https://github.com/zpaulovics/datetimepicker-rails
  $datetimepicker = $('.date_picker.form-control, .datetime_picker.form-control');
  $datetimepicker.datetimepicker({
    useStrict: true, keepInvalid: true, useCurrent: false
  });

  // Using 'blur' here, because 'change' or 'dp.change' is not fired every time
  // (see https://github.com/cubing/worldcubeassociation.org/issues/376#issuecomment-180547289).
  // Also, 'input' gets too annoying, because it flashes at every stroke until you have
  // a valid date typed.
  $datetimepicker.on('blur', function() {
    var $this = $(this);
    var datetimepicker = $this.data("DateTimePicker");
    var val = $this.val();
    var valid = val === "" || moment(val, datetimepicker.format(), true).isValid();

    if(valid) {
      $this.parent().siblings('p').removeClass('alert alert-danger');
      $this.removeClass('alert-danger');
    } else {
      $this.parent().siblings('p').addClass('alert alert-danger');
      $this.parent().siblings('p').fadeIn(200).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200);
      $this.addClass('alert-danger');
    }
  });

  // We use dp.hide to capture clicking on a date. We then tab to the next
  // form item, so the picker is just one click away, in case the user made
  // a mistake or wants to select a different date. This also triggers the
  // 'blur' event, used above to validate the date.
  $datetimepicker.on('dp.hide', function() {
    $.tabNext();
  });

  $('.datetimerange').each(function() {
    var $inputGroups = $(this).find('.date_picker.form-control');
    var $range1 = $inputGroups.eq(0);
    var $range2 = $inputGroups.eq(1);

    $range1.on("dp.change", function(e) {
      var startDate = $range1.data("DateTimePicker").date() || false;
      var endDate = $range2.data("DateTimePicker").date();
      $range2.data("DateTimePicker").minDate(startDate);
      if (startDate && (!endDate || endDate < startDate)) {
        $range2.data("DateTimePicker").date(startDate);
      }
    }).trigger("dp.change");
  });

  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
  $('input.wca-autocomplete').wcaAutocomplete();

  var $tablesToFloatHeaders = $('table.floatThead');
  $tablesToFloatHeaders.floatThead({
    zIndex: 999, // Allow bootstrap popups (z-index 1000) to show up on top.
  });
  // Workaround for https://github.com/mkoryak/floatThead/issues/263
  $tablesToFloatHeaders.each(function() {
    var $table = $(this);
    $table.closest('.table-responsive').scroll(function(e) {
      $table.floatThead('reflow');
    });
  });

  // After a popup actually occurs, there may be some images that need to load.
  // Here we add load listeners for those images and resize the popup once they
  // have loaded. We have to be careful not to end up in an infinite loop
  // (hence the ignoreInsert variable).
  var ignoreInsert = false;
  $('[data-toggle="popover"]').on('inserted.bs.popover', function(e) {
    var $popoverTrigger = $(e.currentTarget);
    if($popoverTrigger.data('ignoreInsert')) {
      $popoverTrigger.data('ignoreInsert', false);
      return;
    }
    $('.popover img').on('load.resizePopover', function() {
      // While waiting for the image inside the popover to load,
      // the popover may have been hidden. Only show (resize) it if
      // it's currently visible.
      // Trick to detect if popover is currently visible from:
      //  http://stackoverflow.com/a/29923760
      var popoverVisible = !!$popoverTrigger.attr('aria-describedby');
      if(!popoverVisible) {
        return;
      }
      $popoverTrigger.data('ignoreInsert', true);
      $popoverTrigger.popover('show');
    });
  });

  $("form").bind("keypress", function(e) {
    // ctrl+enter should always submit a form.
    if((e.which === 13 || e.which === 10) && e.ctrlKey) {
      // Find the submit button for this form and click it.
      // Note that we don't submit the form because that would bypass
      // any click listeners on the submit button.
      $(this).find('[type=submit]')[0].click();
    }
  });
  $("form.no-submit-on-enter").bind("keypress", function(e) {
    // We allow pressing enter inside textareas, because that only inserts
    // a newline, it doesn't submit the form.
    // Note that we let the keypress occur if ctrl is being held down, as
    // we still want ctrl+enter to submit the form.
    if(e.which === 13 && !e.ctrlKey && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });
});

// http://stackoverflow.com/a/5603156
(function($) {
  $.fn.serializeJSON = function() {
    var json = {};
    $.map($(this).serializeArray(), function(n, i) {
      json[n.name] = n.value;
    });
    return json;
  };
})(jQuery);

// Polyfill for Math.trunc from
//  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc#Polyfill
Math.trunc = Math.trunc || function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};
