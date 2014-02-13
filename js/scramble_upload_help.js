/*
 * Code to help 
 */

function get_scramble_info(obj) {
  var compid = $('#form-element-competitionId').find(":selected").val();

  $.ajax({
    url: ("check_comp_scrambles.php?rand=" + Math.random() + "&competitionId=" + compid),
  })
  .done( function(data) {
    $('#notice_area').html(data);
    $('#notice_area a.remove_link').click(function(e) {
      e.preventDefault();
      var link = $(this);
      //Load page into table cell.
      $.ajax({
        url: $(this).attr('href'),
      })
      .done( function(data) {
        // Not a good cell, but don't make it a bad cell just in case
        link.parent().removeClass('good_cell').html(data);
      });
    })
  });

}

$(document).ready(function() {
  get_scramble_info(0);
  $('#form-element-competitionId').change(get_scramble_info);
});
