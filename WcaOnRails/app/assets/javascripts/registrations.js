onPage('registrations#edit_registrations', function() {
  var $registrationsTable = $('table.registrations-table:not(.floatThead-table)');

  var showHideActions = function(e) {
    var $selectedRows = $registrationsTable.find("tr.selected");
    $('.selected-registrations-actions').toggle($selectedRows.length > 0);

    var $selectedPendingDeletedRows = $selectedRows.filter(".registration-pending, .registration-deleted");
    $('.selected-pending-deleted-registrations-actions').toggle($selectedPendingDeletedRows.length > 0);

    var $selectedApprovedDeletedRows = $selectedRows.filter(".registration-accepted, .registration-deleted");
    $('.selected-approved-deleted-registrations-actions').toggle($selectedApprovedDeletedRows.length > 0);

    var $selectedPendingApprovedRows = $selectedRows.filter(".registration-pending, .registration-accepted");
    $('.selected-pending-approved-registrations-actions').toggle($selectedPendingApprovedRows.length > 0);

    var emails = $selectedRows.find("a[href^=mailto]").map(function() { return this.href.match(/^mailto:(.*)/)[1]; }).toArray();
    document.getElementById("email-selected").href = "mailto:?bcc=" + emails.join(",");
  };
  $registrationsTable.on('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table', function() {
    // Wait in order to let bootstrap-table script add a 'selected' class to the appropriate rows
    setTimeout(showHideActions, 0);
  });
  showHideActions();

  $('button[value=delete-selected]').on("click", function(e) {
    var $selectedRows = $registrationsTable.find("tr.selected");
    if(!confirm("Delete the " + $selectedRows.length + " selected registrations?")) {
      e.preventDefault();
    }
  });
});

onPage('registrations#index', function() {
  // To improve performance we do the first sorting by name server-side.
  // This makes the interface resemble the order.
  $('.name .sortable').addClass('asc');
});

function comparePaymentDate(a, b) {
  var elemA = $(a);
  var elemB = $(b);
  var paidA = elemA.data("paidDate");
  var paidB = elemB.data("paidDate");
  if (paidA !== "" && paidB !== "") {
    // Both have paid, compare their last payment dates
    return paidA.localeCompare(paidB);
  } else if (paidA === "" && paidB === "") {
    // None have paid, compare their registration dates
    return elemA.data("registeredAt").localeCompare(elemB.data("registeredAt"));
  } else {
    return paidA === "" ? 1 : -1;
  }
}

function compareHtmlContent(a, b) {
  var first = $('<p>' + a + '</p>').text().trim();
  var second = $('<p>' + b + '</p>').text().trim();
  return first.localeCompare(second);
}

onPage('registrations#add, registrations#do_add', function() {
  // Bind all/clear cubing event buttons
  $('#clear-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', false);
  });
  $('#select-all-events').on('click', function() {
    $('#events input[type="checkbox"]').prop('checked', true);
  });
});

onPage('registrations#create', function() {
  // Hide the hint when the user selects an event
  // or selects all events
  $('.associated-events input[type="checkbox"], .select-all-events').click(function() {
    // opacity:0 rather than display:none to avoid DOM shifting
    $('.associated-events .select-hint').css('visibility', 'hidden');
  });
});
