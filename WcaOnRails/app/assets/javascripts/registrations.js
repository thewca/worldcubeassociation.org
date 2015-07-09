$(document).on("page:change", function() {
  if(document.body.dataset.railsControllerName !== "registrations") {
    return;
  }

  var $registrations_table = $('table.registrations-table');
  function showHideActions(e) {
    var $checkboxes = $registrations_table.find(".select-row-checkbox:checked");
    if($checkboxes.length > 0) {
      $('.selected-registrations-actions').show();
    } else {
      $('.selected-registrations-actions').hide();
    }
    var emails = $checkboxes.parents("tr").find("a[href^=mailto]").map(function() { return this.href.match(/^mailto:(.*)/)[1]; }).toArray();
    document.getElementById("email-selected").href = "mailto:" + emails.join(",");
  }
  $registrations_table.on("change", ".select-row-checkbox", showHideActions);
  showHideActions();

  $('button[value=delete-selected]').on("click", function(e) {
    if(!confirm("Are you sure you want to delete the selected registrations?")) {
      e.preventDefault();
    }
  });
});
