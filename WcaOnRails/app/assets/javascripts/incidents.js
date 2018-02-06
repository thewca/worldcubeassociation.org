window.wca = window.wca || {};

wca.updateUrlParams = function ($searchInput, $tagsInput) {
    // Update params in the url.
    var params = {
      search: $searchInput.val(),
      tags: $tagsInput.val(),
    };
    $.setUrlParams(params);
}

wca.incidentsBootstrapTable = null

wca.initIncidentsTable = function (opts, $elem, $searchInput, $tagsInput) {
  $elem.on('search.bs.table', function() {
    // Yep, when it's filtered we need to reactivate popovers :(
    $('[data-toggle="popover"]').popover();
    wca.updateUrlParams($searchInput, $tagsInput);
  });

  // It's a search filter input, so there is no point to allow user to create tags
  delete opts["create"];
  opts["onChange"] = function (value) {
    // Hack to force refresh
    if (wca.incidentsBootstrapTable) {
      wca.incidentsBootstrapTable.searchText = " ";
    }
    $elem.bootstrapTable('resetSearch', $searchInput.val());
    wca.updateUrlParams($searchInput, $tagsInput);
  };
  opts["maxOptions"] = 5;
  var tagsParams = $.getUrlParams().tags || "";
  $tagsInput.val(tagsParams);
  $tagsInput.selectize(opts);
  var searchParams = $.getUrlParams().search || "";
  incidentsTable.bootstrapTable('resetSearch', searchParams);
}

wca.searchIncidentsForTag = function(e, tag) {
  e.preventDefault();
  $('.search input').val("");
  var selectize = $('input#incident-tags')[0].selectize;
  selectize.clear();
  selectize.addItem(tag);
}

// Can't use filterBy, as some cells have multiple value, so we have to use a custom search
wca.customIncidentsSearch = function(text) {
  // See the hack to force refresh below...
  if (!wca.incidentsBootstrapTable) {
    wca.incidentsBootstrapTable = this;
  }
  if (text.length === 0) {
    // Hack because bootstrap table does the search but doesn't get the filtered
    // data unless "this.searchText" has non-zero length.
    // See here: https://github.com/wenzhixin/bootstrap-table/blob/22ca907e623ab696fd9711f497989cd30abb5d23/src/bootstrap-table.js#L2395-L2398
    this.searchText = " ";
  }
  var tags_value = $('input#incident-tags').val();
  var filter_tags = tags_value.length > 0 ? tags_value.split(",") : [];
  this.data = this.options.data.filter(function(item) {
    // item[1] is the incidents' tags
    var tags = item._1_data.tags.split(",");
    var filtered = tags.filter(function (tag) {
      return filter_tags.includes(tag);
    });
    // TODO: filter by comps on item[2]
    if (filter_tags.length > 0 && filtered.length === 0) {
      return false;
    }
    // item[0] is actually a link with the title, so we need to turn it into an element
    // then take its text.
    var incident_title = $(item[0]).text();
    return incident_title.indexOf(text) != -1;
  });
}
