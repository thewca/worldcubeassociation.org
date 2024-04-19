onPage('registrations#edit_registrations', () => {
  const $registrationsTable = $('table.registrations-table:not(.floatThead-table)');
  if (!$registrationsTable) {
    return null;
  }

  const showHideActions = function (e) {
    const $selectedRows = $registrationsTable.find('tr.selected');
    $('.selected-registrations-actions').toggle($selectedRows.length > 0);

    const $selectedPendingDeletedRows = $selectedRows.filter('.registration-pending, .registration-deleted');
    $('.selected-pending-deleted-registrations-actions').toggle($selectedPendingDeletedRows.length > 0);

    const $selectedApprovedDeletedRows = $selectedRows.filter('.registration-accepted, .registration-deleted');
    $('.selected-approved-deleted-registrations-actions').toggle($selectedApprovedDeletedRows.length > 0);

    const $selectedPendingApprovedRows = $selectedRows.filter('.registration-pending, .registration-accepted');
    $('.selected-pending-approved-registrations-actions').toggle($selectedPendingApprovedRows.length > 0);

    const emails = $selectedRows.find('a[href^=mailto]').map(function () { return this.href.match(/^mailto:(.*)/)[1]; }).toArray();
    document.getElementById('email-selected').href = `mailto:?bcc=${emails.join(',')}`;
  };
  $registrationsTable.on('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table', () => {
    // Wait in order to let bootstrap-table script add a 'selected' class to the appropriate rows
    setTimeout(showHideActions, 0);
  });
  showHideActions();

  $('button[value=delete-selected]').on('click', (e) => {
    const $selectedRows = $registrationsTable.find('tr.selected');
    if (!confirm(`Delete the ${$selectedRows.length} selected registrations?`)) {
      e.preventDefault();
    }
  });
});

onPage('registrations#index', () => {
  // To improve performance we do the first sorting by name server-side.
  // This makes the interface resemble the order.
  $('.name .sortable').addClass('asc');
});

function comparePaymentDate(a, b) {
  const elemA = $(a);
  const elemB = $(b);
  const paidA = elemA.data('paidDate');
  const paidB = elemB.data('paidDate');
  if (paidA !== '' && paidB !== '') {
    // Both have paid, compare their last payment dates
    return paidA.localeCompare(paidB);
  } if (paidA === '' && paidB === '') {
    // None have paid, compare their registration dates
    return elemA.data('registeredAt').localeCompare(elemB.data('registeredAt'));
  }
  return paidA === '' ? 1 : -1;
}

function compareHtmlContent(a, b) {
  const first = $(`<p>${a}</p>`).text().trim();
  const second = $(`<p>${b}</p>`).text().trim();
  return first.localeCompare(second);
}

onPage('registrations#add, registrations#do_add', () => {
  // Bind all/clear cubing event buttons
  $('#clear-all-events').on('click', () => {
    $('#events input[type="checkbox"]').prop('checked', false);
  });
  $('#select-all-events').on('click', () => {
    $('#events input[type="checkbox"]').prop('checked', true);
  });
});

onPage('registrations#create, registrations#register', () => {
  // Hide the hint when the user selects an event
  // or selects all events
  $('.associated-events input[type="checkbox"], .select-all-events').click(() => {
    // opacity:0 rather than display:none to avoid DOM shifting
    $('.associated-events .select-hint').css('visibility', 'hidden');
  });
});
