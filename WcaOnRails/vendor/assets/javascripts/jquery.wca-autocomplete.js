(function() {
  $.fn.wcaAutocomplete = function() {
    this.each(function() {
      var that = this;

      if(that.wcaAutocomplete) {
        return;
      }
      that.wcaAutocomplete = true;

      var only_one = $(that).hasClass("wca-autocomplete-only_one");
      var is_locked = $(that).hasClass("wca-autocomplete-input_lock");
      var omni_search = $(that).hasClass("wca-autocomplete-search");
      var users_search = $(that).hasClass("wca-autocomplete-users_search");
      var competitions_search = $(that).hasClass("wca-autocomplete-competitions_search");
      var posts_search = $(that).hasClass("wca-autocomplete-posts_search");

      var delimiter = ',';
      var searchFields = window.wca.lodashUniq([
        'wca_id', 'name', // user search fields
        'id', 'cellName', 'cityName', 'countryId', 'name', // competition search fields
        'title', 'body', // post search fields
        'id', 'content_html', // regulation search fields
      ]);

      var url;
      var defaultSearchData = {};
      if(omni_search) {
        url = '/api/v0/search';
      } else if(users_search) {
        url = '/api/v0/search/users';
        var only_staff_delegates = $(that).hasClass("wca-autocomplete-only_staff_delegates");
        var only_trainee_delegates = $(that).hasClass("wca-autocomplete-only_trainee_delegates");
        var persons_table = $(that).hasClass("wca-autocomplete-persons_table");

        if(only_staff_delegates) {
          defaultSearchData.only_staff_delegates = true;
        }
        if(only_trainee_delegates) {
          defaultSearchData.only_trainee_delegates = true;
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
            // Copied from app/views/shared/user.html.erb
            var $div = $('<div class="wca-user"> <div class="avatar-thumbnail"></div> <div class="info"><div class="name"></div><div class="wca-id"></div></div> </div>');
            $div.find(".name").text(user.name);
            $div.find(".avatar-thumbnail").css('background-image', 'url("' + user.avatar.thumb_url + '")');
            if(user.wca_id) {
              $div.find(".wca-id").text(user.wca_id);
            } else {
              $div.find(".wca-id").remove();
            }
            return $div[0].outerHTML;
          },

          competition: function(competition) {
            var $div = $('<div class="wca-autocomplete-competition"><span class="name"></span><i class="fi"></i> <span class="city"></span> (<span class="id"></span>)</div>');
            $div.find(".id").text(competition.id);
            $div.find(".name").text(competition.name);
            $div.find(".city").text(competition.city);
            $div.find(".fi").addClass("fi-" + competition.country_iso2.toLowerCase());
            return $div[0].outerHTML;
          },

          post: function(post) {
            var $div = $('<div class="wca-autocomplete-post"><span class="title"></span></div>');
            $div.find(".title").text(post.title);
            return $div[0].outerHTML;
          },

          regulation: function(regulation) {
            var $div = $('<div class="wca-autocomplete-regulation"><span class="id"></span>: <span class="content_html"></span></div>');
            $div.find(".id").text(regulation.id);
            $div.find(".content_html").text(wca.stripHtmlTags(regulation.content_html))
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
      if(omni_search) {
        // We don't want to pass in a delimiter when we're building a search box, because
        // that causes special behavior when copy pasting.
        delimiter = null;
        create = function(input, callback) {
          var query = input;
          var object = {
            id: query,
            'class': 'search',
            query: query,
            url: '/search?q=' + encodeURIComponent(query),
          };
          callback(object);
        };
        onChange = function(value) {
          var selectedOption = this.options[value];
          if(selectedOption) {
            window.location.href = selectedOption.url;
          }
        };
      }

      var plaintextToSetAfterSelectize = null;
      if(omni_search) {
        plaintextToSetAfterSelectize = $(that).val();
        $(that).val('');
      }
      $(that).selectize({
        noAutoGrow: omni_search,
        plugins: ['restore_on_backspace', 'remove_button', 'do_not_clear_on_blur'],
        preload: true,
        maxItems: only_one ? 1 : null,
        valueField: 'id',
        searchField: searchFields,
        delimiter: delimiter,
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
            data: window.wca.lodashExtend({}, defaultSearchData, { q: query, email: true }),
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
      if(plaintextToSetAfterSelectize) {
        that.selectize.$control_input.val(plaintextToSetAfterSelectize);
        that.selectize.$control_input.trigger("update");
      }
      if(is_locked) {
        that.selectize.lock();
      }
    });

    return this;
  };
})();
