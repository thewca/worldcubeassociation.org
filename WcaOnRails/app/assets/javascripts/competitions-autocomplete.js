// http://stackoverflow.com/a/2593661
RegExp.quote = function(str) {
  return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};
$(function() {
  var findMatches = function(q, cb) {
    var startsRe = new RegExp("^" + RegExp.quote(q), 'i');
    var containsRe = new RegExp(RegExp.quote(q), 'i');
    var res = [startsRe, containsRe];

    // Copy and reverse to iterate from newest to oldest.
    var competitionsCopy = wca.competitions.slice().reverse();

    var matches = [];
    _.each(res, function(re) {
      _.each(['id', 'name', 'cityName', 'countryId'], function(key) {
        _.each(competitionsCopy, function(competition, i) {
          if(!competition) {
            return;
          }
          if(re.test(competition[key])) {
            matches.push(competition);
            delete competitionsCopy[i];
          }
        });
      });
    });
    cb(matches);
  };

  var $competitionSelect = $('input.competitions-autocomplete');
  $competitionSelect.typeahead({
    highlight: true,
    minLength: 1,
  }, {
    name: 'competitions',
    limit: 10,
    source: findMatches,
    display: function(competition) {
      return competition.id;
    },
    templates: {
      suggestion: function(competition) {
        var $div = $('<div class="competition-suggestion"><span class="name"></span><span class="cityName"></span>, <span class="countryId"></span> (<span class="id"></span>)</div>');
        $div.find(".id").text(competition.id);
        $div.find(".name").text(competition.name);
        $div.find(".cityName").text(competition.cityName);
        $div.find(".countryId").text(competition.countryId);
        return $div[0].outerHTML;
      }
    },
  });
});
