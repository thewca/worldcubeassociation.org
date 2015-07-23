$(function() {
  $('input.select-user').each(function() {
    var delegate_only = $(this).hasClass("select-user-delegate");
    var users = _.filter(wca.users, function(user) {
      if(delegate_only) {
        return !!user.delegate_status;
      } else {
        return true;
      }
    });
    $(this).selectize({
      // TODO - don't clear on blur
      plugins: ['restore_on_backspace', 'remove_button'],
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
          url = '/api/v0/users/delegates/search/' + encodeURIComponent(query);
        } else {
          url = '/api/v0/users/search/' + encodeURIComponent(query);
        }
        $.ajax({
          url: url,
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
