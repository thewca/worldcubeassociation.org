$(function() {
  if(document.body.dataset.railsControllerName !== "registrations") {
    return;
  }

  var $registrationsTable = $('table.registrations-table');
  function showHideActions(e) {
    var $selectedRows = $registrationsTable.find("tr.selected-row");
    $('.selected-registrations-actions').toggle($selectedRows.length > 0);

    var $selectedApprovedRows = $selectedRows.filter(".registration-a");
    $('.selected-approved-registrations-actions').toggle($selectedApprovedRows.length > 0);

    var $selectedPendingRows = $selectedRows.filter(".registration-p");
    $('.selected-pending-registrations-actions').toggle($selectedPendingRows.length > 0);

    var emails = $selectedRows.find("a[href^=mailto]").map(function() { return this.href.match(/^mailto:(.*)/)[1]; }).toArray();
    document.getElementById("email-selected").href = "mailto:" + emails.join(",");
  }
  $registrationsTable.on("change", ".select-row-checkbox", function() {
    // Wait for selectable-rows code to run.
    setTimeout(showHideActions, 0);
  });
  $registrationsTable.on("select-all-none-click", function() {
    // Wait for selectable-rows code to run.
    setTimeout(showHideActions, 0);
  });
  showHideActions();

  $('button[value=delete-selected]').on("click", function(e) {
    if(!confirm("Are you sure you want to delete the selected registrations?")) {
      e.preventDefault();
    }
  });

  $('.event-checkbox input[type=checkbox]').on('change', function(e) {
    var eventId = e.target.dataset.eventId;
    var competitionId = e.target.dataset.competitionId;
    var registrationId = e.target.dataset.registrationId;
    var checked = e.target.checked;
    var eventIds = $(e.target).parents('tr').find('.event-checkbox input:checked').map(function() { return this.dataset.eventId; }).toArray().join(" ");
    var url = "/competitions/" + encodeURIComponent(competitionId) + "/registrations/" + encodeURIComponent(registrationId);
    var csrf_token = $('meta[name=csrf-token]').attr('content');
    var csrf_param = $('meta[name=csrf-param]').attr('content');
    var data = {};
    data["registration[eventIds]"] = eventIds;
    data[csrf_param] = csrf_token;
    $.ajax({
      url: url,
      method: "PUT",
      data: data,
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Accept", "application/json");
      }
    }).fail(function(jqXHR, textStatus) {
      alert("Request failed: " + textStatus);
    }).always(function() {
      // Update total number of people registered for each event here.
      $('table.registrations-table').each(function() {
        var $table = $(this);
        var registrations = _.groupBy($table.find("tbody tr .event-checkbox input:checked").map(function() { return this.dataset.eventId; }));
        $table.find('td[data-registration-count-event-id]').each(function() {
          var $countTd = $(this);
          var eventId = $countTd.data("registration-count-event-id");
          $countTd.text((registrations[eventId] || []).length);
        });
      });
    });
  });
});
