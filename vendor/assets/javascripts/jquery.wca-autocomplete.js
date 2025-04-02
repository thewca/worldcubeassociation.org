(function () {
  $.fn.wcaAutocomplete = function () {
    this.each(function () {
      const that = this;

      if (that.wcaAutocomplete) {
        return;
      }
      that.wcaAutocomplete = true;

      const only_one = $(that).hasClass('wca-autocomplete-only_one');
      const is_locked = $(that).hasClass('wca-autocomplete-input_lock');
      const omni_search = $(that).hasClass('wca-autocomplete-search');
      const users_search = $(that).hasClass('wca-autocomplete-users_search');
      const competitions_search = $(that).hasClass('wca-autocomplete-competitions_search');
      const posts_search = $(that).hasClass('wca-autocomplete-posts_search');

      let delimiter = ',';
      const searchFields = window.wca.lodashUniq([
        'wca_id', 'name', // user search fields
        'id', 'cell_name', 'city_name', 'country_id', 'name', // competition search fields
        'title', 'body', // post search fields
        'id', 'content_html', // regulation search fields
      ]);

      let url;
      const defaultSearchData = {};
      if (omni_search) {
        url = '/api/v0/search';
      } else if (users_search) {
        url = '/api/v0/search/users';
        const only_staff_delegates = $(that).hasClass('wca-autocomplete-only_staff_delegates');
        const only_trainee_delegates = $(that).hasClass('wca-autocomplete-only_trainee_delegates');
        const persons_table = $(that).hasClass('wca-autocomplete-persons_table');

        if (only_staff_delegates) {
          defaultSearchData.only_staff_delegates = true;
        }
        if (only_trainee_delegates) {
          defaultSearchData.only_trainee_delegates = true;
        }
        if (persons_table) {
          defaultSearchData.persons_table = true;
        }
      } else if (competitions_search) {
        url = '/api/v0/search/competitions';
      } else if (posts_search) {
        url = '/api/v0/search/posts';
      } else {
        throw new Error('Unrecognized wca-autocomplete type');
      }

      const toHtml = function (item) {
        const toHtmlByClass = {
          user(user) {
            // Copied from app/views/shared/user.html.erb
            const $div = $('<div class="wca-user"> <div class="avatar-thumbnail"></div> <div class="info"><div class="name"></div><div class="wca-id"></div></div> </div>');
            $div.find('.name').text(user.name);
            $div.find('.avatar-thumbnail').css('background-image', `url("${user.avatar.thumb_url}")`);
            if (user.wca_id) {
              $div.find('.wca-id').text(user.wca_id);
            } else {
              $div.find('.wca-id').remove();
            }
            return $div[0].outerHTML;
          },

          competition(competition) {
            const $div = $('<div class="wca-autocomplete-competition"><span class="name"></span><i class="fi"></i> <span class="city"></span> (<span class="id"></span>)</div>');
            $div.find('.id').text(competition.id);
            $div.find('.name').text(competition.name);
            $div.find('.city').text(competition.city);
            $div.find('.fi').addClass(`fi-${competition.country_iso2.toLowerCase()}`);
            return $div[0].outerHTML;
          },

          post(post) {
            const $div = $('<div class="wca-autocomplete-post"><span class="title"></span></div>');
            $div.find('.title').text(post.title);
            return $div[0].outerHTML;
          },

          regulation(regulation) {
            const $div = $('<div class="wca-autocomplete-regulation"><span class="id"></span>: <span class="content_html"></span></div>');
            $div.find('.id').text(regulation.id);
            $div.find('.content_html').text(wca.stripHtmlTags(regulation.content_html));
            return $div[0].outerHTML;
          },

          search(query) {
            const $div = $('<div></div>');
            $div.text(query.query);
            return $div[0].outerHTML;
          },
        };
        // Hack until we merge the Person and user tables.
        toHtmlByClass.person = toHtmlByClass.user;

        const func = toHtmlByClass[item.class];
        if (!func) {
          throw new Error(`Unrecognized class ${item.class}`);
        }
        return func(item);
      };

      let create = null;
      let onChange = null;
      if (omni_search) {
        // We don't want to pass in a delimiter when we're building a search box, because
        // that causes special behavior when copy pasting.
        delimiter = null;
        create = function (input, callback) {
          const query = input;
          const object = {
            id: query,
            class: 'search',
            query,
            url: `/search?q=${encodeURIComponent(query)}`,
          };
          callback(object);
        };
        onChange = function (value) {
          const selectedOption = this.options[value];
          if (selectedOption) {
            window.location.href = selectedOption.url;
          }
        };
      }

      let plaintextToSetAfterSelectize = null;
      if (omni_search) {
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
        delimiter,
        persist: false,
        addPrecedence: true,
        create,
        render: {
          option: toHtml,
          item: toHtml,
          option_create(data, escape) {
            const $div = $('<div class="create">Search for <strong class="data"></strong>&hellip;</div>');
            $div.find('.data').text(data.input);
            return $div[0].outerHTML;
          },
        },
        onChange,
        score(search) {
          const score = this.getScoreFunction(search);
          return function (item) {
            return score(item);
          };
        },
        load(query, callback) {
          if (!query.length) {
            return callback();
          }
          $.ajax({
            url,
            data: window.wca.lodashExtend({}, defaultSearchData, { q: query, email: true }),
            type: 'GET',
            error() {
              callback();
            },
            success(response) {
              callback(response.result);
            },
          });
        },
      });
      if (plaintextToSetAfterSelectize) {
        that.selectize.$control_input.val(plaintextToSetAfterSelectize);
        that.selectize.$control_input.trigger('update');
      }
      if (is_locked) {
        that.selectize.lock();
      }
    });

    return this;
  };
}());
