// Javascript code to enable selecitze and typahead.js on certain input.

// selectize
$(function() {
  $('.wca-autocomplete').each(function() {
    var that = this;

    var only_one = $(that).hasClass("wca-autocomplete-only_one");
    var users_search = $(that).hasClass("wca-autocomplete-users_search");
    var competitions_search = $(that).hasClass("wca-autocomplete-competitions_search");

    var searchFields = [];
    searchFields = searchFields.concat([ 'wca_id', 'name' ]); // user search fields
    searchFields = searchFields.concat([ 'id', 'name', 'cellName', 'cityName', 'countryId' ]); // competition search fields
    searchFields = searchFields.concat([ 'title', 'body' ]); // post search fields

    var url;
    var defaultSearchData = {};
    var valueField = 'id';
    if(users_search) {
      url = '/api/v0/users/search';
      var only_delegates = $(that).hasClass("wca-autocomplete-only_delegates");
      var persons_table = $(that).hasClass("wca-autocomplete-persons_table");

      if(only_delegates) {
        defaultSearchData.only_delegates = true;
      }
      if(persons_table) {
        valueField = 'wca_id';
        defaultSearchData.persons_table = true;
      }
    } else if(competitions_search) {
      url = '/api/v0/competitions/search';
    } else {
      throw new Error("Unrecognized wca-autocomplete type");
    }

    var toHtml = function(item) {
      var toHtmlByClass = {
        user: function(user) {
          var $div = $('<div class="wca-autocomplete-user"><span class="name"></span> <span class="wca-id"></span></div>');
          $div.find(".name").text(user.name);
          if(user.wca_id) {
            $div.find(".wca-id").text(user.wca_id);
          } else {
            $div.find(".wca-id").remove();
          }
          return $div[0].outerHTML;
        },

        competition: function(competition) {
          var $div = $('<div class="wca-autocomplete-competition"><span class="name"></span><span class="cityName"></span>, <span class="countryId"></span> (<span class="id"></span>)</div>');
          $div.find(".id").text(competition.id);
          $div.find(".name").text(competition.name);
          $div.find(".cityName").text(competition.cityName);
          $div.find(".countryId").text(competition.countryId);
          return $div[0].outerHTML;
        },

        post: function(post) {
          var $div = $('<div class="wca-autocomplete-post"><span class="title"></span></div>');
          $div.find(".title").text(post.title);
          return $div[0].outerHTML;
        },
      };
      // Hack until we merge the Person and user tables.
      toHtmlByClass.person = toHtmlByClass.user;

      var func = toHtmlByClass[item['class']];
      if(!func) {
        throw new Error("Unrecognized class " + item['class']);
      }
      return func(item);
    };

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
          success: function(response) {
            callback(response.result);
          },
        });
      }
    });
  });
});
