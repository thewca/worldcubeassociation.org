// Manifest for pages that render a bootstrap-table and/or a table with a
// floating header. It is not part of application.js because it accounts for a
// large share of its size while only a handful of pages need it.
//
// Loaded on demand through `add_to_js_assets("tables")`, which `wca_table` does
// automatically. Views writing their table markup by hand have to call it
// themselves.
//
//= require jquery.floatThead.js
//= require bootstrap-table
//= require bootstrap-table-locale-all
//= require extensions/bootstrap-table-mobile
//= require i18n-bootstrap-table
//= require_self

$(function() {
  var $tablesToFloatHeaders = $('table.floatThead');
  $tablesToFloatHeaders.floatThead({
    zIndex: 999, // Allow bootstrap popups (z-index 1000) to show up on top.
    responsiveContainer: function($table) {
      return $table.closest(".table-responsive");
    },
  });
});

// Bootstrap-table default options
$.extend($.fn.bootstrapTable.defaults, {
  searchTimeOut: window.wca.TEXT_INPUT_DEBOUNCE_MS,
  trimOnSearch: false
});

// Setting up bootstrap-table
$(function() {
  $('table[data-toggle="table"]').addClass('bs-table');

  // Hide loading box
  $('.bs-table').bootstrapTable('hideLoading');

  // It's not necessary when bootstrap-table will be distributed with this merged:
  // https://github.com/wenzhixin/bootstrap-table/pull/2145
  // (and the appropriate gem will be updated)
  // -------------------------------------------------------------------
  // Triggered when a sort arrow is clicked but before a table is sorted
  $('table').on('sort.bs.table', function(e, name, order) {
    // The table column that we are sorting by
    var field = $(this).floatThead('getRowGroups').eq(0).find('th[data-field="' + name + '"] .sortable');
    // If it's not the field we are currently sorting by
    if(!field.is('.asc, .desc')) {
      // Change the sort order that's set in data-order ('asc' by default)
      var options = $(this).bootstrapTable('getOptions');
      options.sortOrder = options.columns[0].find(function(option) { return option.field == name; }).order;
      // Now the table will be sorted using the order that we set
    }
  });
  // -------------------------------------------------------------------

  // It's not necessary when bootstrap-table will be distributed with this issue solved:
  // https://github.com/wenzhixin/bootstrap-table/issues/2154
  // (and the appropriate gem will be updated)
  // -------------------------------------------------------------------
  // Prevent bootstrap-table from selecting a row when a link is clicked
  $('.bs-table td a').on('click', function(e) {
    e.stopPropagation();
  });
  // -------------------------------------------------------------------

  // Set values of checkboxes in a table to corresponding rows ids
  var initCheckboxesValues = function($table) {
    $table.find('tr td input[type="checkbox"]').each(function(index) {
      $(this).val($(this).parents('tr').attr('id'));
    });
  };
  initCheckboxesValues($('.bs-table'));
  $('table').on('post-body.bs.table', function() {
    initCheckboxesValues($(this));
    // Re-apply tooltip on each table body change
    $('[data-toggle="tooltip"]').tooltip();
  });
});
