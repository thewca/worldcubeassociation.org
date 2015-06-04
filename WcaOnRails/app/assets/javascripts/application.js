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
//= require turbolinks
//= require bootstrap-sprockets
//= require bootstrap-hover-dropdown
//= require local_time
//= require wice_grid
//= require jquery.are-you-sure
//= require_tree .

// Reinitialize any plugins when turbolinks changes the page.
$(document).on("page:change", function() {
  $('.dropdown-toggle').dropdownHover();
  $('form').areYouSure();
});

// Hack to make jquery.are-you-sure work with Rails's turbo links, which does
// not fire the beforeunload event.
//  https://github.com/rails/turbolinks/issues/249
$(document).bind('page:before-change', function() {
  $dirtyForms = $("form").filter('.dirty');
  if($dirtyForms.length === 0) {
    return;
  }
  return confirm('You have unsaved changes!\n\nAre you sure you want to leave this page?');
});
