$(function() {
  $('.select-user').each(function() {
    var that = this;
    var only_delegates = $(that).hasClass("select-user-only_delegates");
    var search_persons = $(that).hasClass("select-user-search_persons");
    var only_one = $(that).hasClass("select-user-only_one");
    var users = _.filter(wca.users, function(user) {
      if(only_delegates) {
        // It's ok to allow a non delegate if they were previously
        // selected as the delegate for the competition (this will
        // certainly happen for old competitions, where the delegate has
        // retired).
        var currentDelegateIds = that.value.split(",").map(function(i) { return parseInt(i); });
        return !!user.delegate_status || _.include(currentDelegateIds, user.id);
      } else {
        return true;
      }
    });

    function userToHtml(user, escape) {
      var html = '<span class="name">' + " " + escape(user.name) + "</span> ";
      if(user.wca_id) {
        html += '<span class="wca-id">' + escape(user.wca_id) + "</span>";
      }
      return '<div class="select-user">' + html + '</div>';
    }
    $(this).selectize({
      plugins: ['restore_on_backspace', 'remove_button', 'do_not_clear_on_blur'],
      options: users,
      preload: true,
      maxItems: only_one ? 1 : null,
      valueField: search_persons ? 'wca_id' : 'id',
      searchField: ['wca_id', 'name'],
      delimeter: ',',
      render: {
        option: userToHtml,
        item: userToHtml,
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
        var url = '/api/v0/users/search';
        var data = {
          q: query,
        };
        if(only_delegates) {
          data.only_delegates = true;
        }
        if(search_persons) {
          data.search_persons = true;
        }
        $.ajax({
          url: url,
          data: data,
          type: 'GET',
          error: function() {
            callback();
          },
          success: function(res) {
            callback(res.users);
          },
        });
      }
    });
  });
});
