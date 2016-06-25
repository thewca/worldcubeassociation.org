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
})(jQuery);
