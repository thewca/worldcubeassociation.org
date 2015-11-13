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
  // Here we add load listeners for those images and resize the popup once they've
  // loaded. We have to be careful not to end up in an infinite loop (hence the
  // ignoreInsert variable).
  var ignoreInsert = false;
  $('[data-toggle="popover"]').on('inserted.bs.popover', function(e) {
    if(ignoreInsert) {
      return;
    }
    var $popoverTrigger = $(e.currentTarget);
    $('.popover img').on('load', function() {
      ignoreInsert = true;
      $popoverTrigger.on('inserted.bs.popover', function(e) {
        ignoreInsert = false;
      });
      $popoverTrigger.popover('show');
    });
  });

  $("form.no-submit-on-enter").bind("keypress", function(e) {
    if(e.which === 13) {
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
