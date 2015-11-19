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
//= require bootstrap-datepicker/core
//= require locationpicker.jquery
//= require twitter/typeahead
//= require underscore
//= require selectize
//= require selectize.do_not_clear_on_blur
//= require best_in_place
//= require jquery.purr
//= require best_in_place.purr
//= require jquery.jcrop
//= require lodash
//= require_tree .

// Dumping ground for... stuff
window.wca = window.wca || {};

$(function() {
  $('.dropdown-toggle').dropdownHover();
  $('form.are-you-sure').areYouSure();
  $('.input-daterange').datepicker({
    format: "yyyy-mm-dd",
    todayBtn: true,
    todayHighlight: true
  });
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();

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
  $(".best_in_place").best_in_place();
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
