$(document).ready(function() {
  $('.js-check-all[data-round]').click(function(e) {
    var round = $(this).data('round');
    var checkboxes = $('input[type=checkbox][data-round="' + round + '"]');
    checkboxes.prop('checked', true);
    e.preventDefault();
  });
  $('.js-check-none[data-round]').click(function(e) {
    var round = $(this).data('round');
    var checkboxes = $('input[type=checkbox][data-round="' + round + '"]');
    checkboxes.prop('checked', false);
    e.preventDefault();
  });
});
