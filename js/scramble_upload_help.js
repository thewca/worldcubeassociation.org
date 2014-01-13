/*
 * Code to help 
 */

function get_scramble_info(obj) {
  var compid = $('#form-element-competitionId').find(":selected").val();

  $.ajax({
    url: ("../js/check_comp_scrambles.php?rand=" + Math.random() + "&competitionId=" + compid),
  })
  .done( function(data) {
    $('#notice_area').html(data);
  });

}

$(document).ready(function() {
  get_scramble_info(0);
  $('#form-element-competitionId').change(get_scramble_info);
});
