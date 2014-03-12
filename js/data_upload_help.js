/*
 * Code to help 
 */

function get_comp_info(obj) {
  var compid = $('#form-element-competitionId').find(":selected").val();

  $.ajax({
    url: ("scripts/check_comp_data.php?rand=" + Math.random() + "&competitionId=" + compid),
  })
  .done( function(data) {
    $('#notice_area').html(data);

    // remove scramble links
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
    });

    // remove competition data; import data links
    $('#notice_area a.call_and_refresh').click(function(e) {
      e.preventDefault();
      var link = $(this);
      //Load page into table cell.
      $.ajax({
        url: $(this).attr('href'),
      })
      .done( function(data) {
        get_comp_info(0);
      });
    });

  });

}

$(document).ready(function() {
  $('#form-element-competitionId').chosen();
  get_comp_info(0);
  $('#form-element-competitionId').change(get_comp_info);
});
