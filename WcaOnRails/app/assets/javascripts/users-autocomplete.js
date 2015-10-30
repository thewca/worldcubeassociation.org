$(function() {
  $('input.select-user').each(function() {
    var that = this;
    var delegate_only = $(that).hasClass("select-user-delegate");
    var users = _.filter(wca.users, function(user) {
      if(delegate_only) {
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
    $(this).selectize({
      plugins: ['restore_on_backspace', 'remove_button', 'do_not_clear_on_blur'],
      options: users,
      preload: true,
      valueField: 'id',
      labelField: 'name',
      searchField: ['name'],
      delimeter: ',',
      render: {
        option: function(item, escape) {
          var html = '<span class="name">' + " " + escape(item.name) + "</span> ";
          if(item.wca_id) {
            html += '<span class="wca-id">' + escape(item.wca_id) + "</span>";
          }
          return '<div class="select-user">' + html + '</div>';
        }
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
        var url;
        if(delegate_only) {
          url = '/api/v0/users/delegates/search';
        } else {
          url = '/api/v0/users/search';
        }
        $.ajax({
          url: url,
          data: {
            q: query,
          },
          type: 'GET',
          error: function() {
            callback();
          },
          success: function(res) {
            callback(res.users);
          }
        });
      }
    });
  });
});
