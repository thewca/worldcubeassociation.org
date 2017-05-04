// http://stackoverflow.com/a/5603156
(function($) {
  $.fn.serializeJSON = function() {
    var json = {};
    $.map($(this).serializeArray(), function(n, i) {
      json[n.name] = n.value;
    });
    return json;
  };
})(jQuery);

(function($){
  // http://stackoverflow.com/a/8486188
  $.getUrlParams = function() {
    var query = location.search.substr(1);
    var result = {};
    if(query) {
      query.split("&").forEach(function(part) {
        var item = decodeURIComponent(part).split("=");
        result[item[0]] = item[1];
      });
    }
    return result;
  };

  $.setUrlParams = function(params) {
    var allParams = $.extend({}, $.getUrlParams(), params);
    history.replaceState(null, null, '?' + $.param(allParams));
  };
})(jQuery);
