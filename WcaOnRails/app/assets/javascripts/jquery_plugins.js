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

// Mostly from https://gist.github.com/alkos333/1771618
(function($){
  $.getUrlParam = function(name){
    var result = new RegExp(name + '=([^&]*)', 'i').exec(window.location.search);
    return result && (decodeURIComponent(result[1]) || '');
  };

  // http://stackoverflow.com/a/8486188
  $.urlParams = function() {
    var query = location.search.substr(1);
    var result = {};
    if(query) {
      query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
      });
    }
    return result;
  };

  $.setUrlParams = function(params) {
    var allParams = $.extend({}, $.urlParams(), params);
    history.replaceState(null, null, '?' + $.param(allParams));
  };
})(jQuery);
