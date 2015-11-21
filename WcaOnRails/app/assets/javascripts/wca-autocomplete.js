$(function() {
  $('.wca-autocomplete').each(function() {
    var that = this;

    var only_one = $(that).hasClass("wca-autocomplete-only_one");
    var search = $(that).hasClass("wca-autocomplete-search");
    var omni_search = $(that).hasClass("wca-autocomplete-search");
    var users_search = $(that).hasClass("wca-autocomplete-users_search");
    var competitions_search = $(that).hasClass("wca-autocomplete-competitions_search");
    var posts_search = $(that).hasClass("wca-autocomplete-posts_search");

    var searchFields = [];
    searchFields = searchFields.concat([ 'wca_id', 'name' ]); // user search fields
    searchFields = searchFields.concat([ 'id', 'name', 'cellName', 'cityName', 'countryId' ]); // competition search fields
    searchFields = searchFields.concat([ 'title', 'body' ]); // post search fields

    var url;
    var defaultSearchData = {};
    if(omni_search) {
      url = '/api/v0/search';
    } else if(users_search) {
      url = '/api/v0/search/users';
      var only_delegates = $(that).hasClass("wca-autocomplete-only_delegates");
      var persons_table = $(that).hasClass("wca-autocomplete-persons_table");

      if(only_delegates) {
        defaultSearchData.only_delegates = true;
      }
      if(persons_table) {
        defaultSearchData.persons_table = true;
      }
    } else if(competitions_search) {
      url = '/api/v0/search/competitions';
    } else if(posts_search) {
      url = '/api/v0/search/posts';
    } else {
      throw new Error("Unrecognized wca-autocomplete type");
    }

    var toHtml = function(item) {
      var toHtmlByClass = {
        user: function(user) {
          var $div = $('<div class="wca-autocomplete-user"><span class="avatar-thumbnail"></span> <span class="name"></span> <span class="wca-id"></span></div>');
          $div.find(".name").text(user.name);
          if(user.avatar) {
            $div.find(".avatar-thumbnail").css('background-image', 'url("' + user.avatar.thumb_url + '")');
          } else {
            $div.find(".avatar-thumbnail").addClass('avatar-thumbnail-noheight');
          }
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

        search: function(query) {
          var $div = $('<div></div>');
          $div.text(query.query);
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

    var create = null;
    var onChange = null;
    if(search) {
      create = function(input, callback) {
        var query = input;
        var object = {
          id: query,
          query: query,
          'class': 'search',
          url: '/search?q=' + encodeURIComponent(query),
        };
        callback(object);
      };
      onChange = function(value) {
        var selectedOption = this.options[value];
        window.location.href = selectedOption.url;
      };
    }

    $(that).selectize({
      plugins: ['restore_on_backspace', 'remove_button', 'do_not_clear_on_blur'],
      preload: true,
      maxItems: only_one ? 1 : null,
      valueField: 'id',
      searchField: searchFields,
      delimeter: ',',
      persist: false,
      addPrecedence: true,
      create: create,
      render: {
        option: toHtml,
        item: toHtml,
        option_create: function(data, escape) {
          var $div = $('<div class="create">Search for <strong class="data"></strong>&hellip;</div>');
          $div.find(".data").text(data.input);
          return $div[0].outerHTML;
        },
      },
      onChange: onChange,
      onFocus: function() {
        // Upon receiving focus, we animate a resize of the input. If we get unlucky,
        // the dropdown will appear while the input is still tiny, and the dropdown
        // will remain tiny.
        // To work around this, we wait until the transition is done.
        // complete, and then reposition the dropdown.
        // From http://blog.teamtreehouse.com/using-jquery-to-detect-when-css3-animations-and-transitions-end
        var that = this;
        this.$control.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
          that.positionDropdown();
        });
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
