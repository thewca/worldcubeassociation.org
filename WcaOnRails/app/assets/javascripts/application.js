// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require bootstrap-sprockets
//= require bootstrap-hover-dropdown
//= require local_time
//= require wice_grid
//= require jquery.are-you-sure
//= require bootstrap-datepicker/core
//= require locationpicker.jquery
//= require twitter/typeahead
//= require underscore
//= require selectize
//= require_tree .

$(function() {
  $('.dropdown-toggle').dropdownHover();
  $('form.are-you-sure').areYouSure();
  $('.input-daterange').datepicker({
    format: "yyyy-mm-dd",
    todayBtn: true,
    todayHighlight: true
  });
  $('[data-toggle="tooltip"]').tooltip();

  $("form.no-submit-on-enter").bind("keypress", function(e) {
    if(e.which === 13) {
      e.preventDefault();
    }
  });

  $('input.select-user').selectize({
    // TODO - don't clear on blur
    plugins: ['restore_on_backspace', 'remove_button'],
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
      if(!query.length) return callback();
      var delegate_only = this.$input.hasClass("select-user-delegate");
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
