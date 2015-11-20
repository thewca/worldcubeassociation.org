// Javascript code to enable selecitze and typahead.js on certain input.

// selectize
$(function() {
  $('.wca-autocomplete').each(function() {
    var that = this;

    var only_one = $(that).hasClass("wca-autocomplete-only_one");

    var url;
    var defaultSearchData = {};
    var jsonArrayName;

    var toHtml;
    var searchFields;
    var valueField = 'id';

    var users_search = $(that).hasClass("wca-autocomplete-users_search");
    var competitions_search = $(that).hasClass("wca-autocomplete-competitions_search");
    if(users_search) {
      url = '/api/v0/users/search';
      searchFields = [ 'wca_id', 'name' ];
      jsonArrayName = 'users';
      var only_delegates = $(that).hasClass("wca-autocomplete-only_delegates");
      var persons_table = $(that).hasClass("wca-autocomplete-persons_table");

      if(only_delegates) {
        defaultSearchData.only_delegates = true;
      }
      if(persons_table) {
        valueField = 'wca_id';
        defaultSearchData.persons_table = true;
      }
      toHtml = function(user, escape) {
        var html = '<span class="name">' + " " + escape(user.name) + "</span> ";
        if(user.wca_id) {
          html += '<span class="wca-id">' + escape(user.wca_id) + "</span>";
        }
        return '<div class="wca-autocomplete-user">' + html + '</div>';
      };
    } else if(competitions_search) {
      url = '/api/v0/competitions/search';
      searchFields = [ 'id', 'name', 'cellName', 'cityName', 'countryId' ];
      jsonArrayName = 'competitions';
      toHtml = function(competition, escape) {
        var $div = $('<div class="wca-autocomplete-competition"><span class="name"></span><span class="cityName"></span>, <span class="countryId"></span> (<span class="id"></span>)</div>');
        $div.find(".id").text(competition.id);
        $div.find(".name").text(competition.name);
        $div.find(".cityName").text(competition.cityName);
        $div.find(".countryId").text(competition.countryId);
        return $div[0].outerHTML;
      };
    } else {
      throw new Error("Unrecognized wca-autocomplete type");
    }

    $(that).selectize({
      plugins: ['restore_on_backspace', 'remove_button', 'do_not_clear_on_blur'],
      preload: true,
      maxItems: only_one ? 1 : null,
      valueField: valueField,
      searchField: searchFields,
      delimeter: ',',
      render: {
        option: toHtml,
        item: toHtml,
      },
      score: function(search) {
        var score = this.getScoreFunction(search);
        return function(item) {
          return score(item);
        };
      },
      load: function(query, callback) {
        if(!query.length) {
          return callback();
        }
        $.ajax({
          url: url,
          data: _.extend({}, defaultSearchData, { q: query }),
          type: 'GET',
          error: function() {
            callback();
          },
          success: function(res) {
            callback(res[jsonArrayName]);
          },
        });
      }
    });
  });
});
