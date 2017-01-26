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
//= require jquery.are-you-sure
//= require locationpicker.jquery
//= require selectize
//= require selectize.do_not_clear_on_blur
//= require jquery.jcrop
//= require lodash
//= require jquery.wca-autocomplete
//= require jquery.floatThead.js
//= require cocoon
//= require moment
//= require moment/es.js
//= require moment/fr.js
//= require moment/it.js
//= require moment/pl.js
//= require moment/pt-br.js
//= require moment/zh-cn.js
//= require moment/nl.js
//= require bootstrap-datetimepicker
//= require markerclusterer
//= require bootstrap-table
//= require extensions/bootstrap-table-mobile
//= require autosize
//= require simplemde
//= require jquery_plugins
//= require_self
//= require_tree .

// Global variables
var TEXT_INPUT_DEBOUNCE_MS = 250;


// Dumping ground for... stuff
window.wca = window.wca || {};

wca._pendingAjaxById = {};
wca.cancelPendingAjaxAndAjax = function(id, options) {
  if(wca._pendingAjaxById[id]) {
    wca._pendingAjaxById[id].abort();
  }
  wca._pendingAjaxById[id] = $.ajax(options).always(function() {
    delete wca._pendingAjaxById[id];
  });
  return wca._pendingAjaxById[id];
};

wca._googleMapsLoaded = false;
wca._onGoogleMapsLoaded = function() {
  wca._googleMapsLoaded = true;
  wca._googleMapsLoadedListeners.forEach(function(listener) {
    listener();
  });
  wca._googleMapsLoadedListeners = null;
};
wca._googleMapsLoadedListeners = [];
wca.addGoogleMapsLoadedListener = function(listener) {
  if(wca._googleMapsLoaded) {
    listener();
  } else {
    wca._googleMapsLoadedListeners.push(listener);
  }
};

wca.competitionsToMarkers = function(map, competitions) {
  var markers = [];

  competitions.forEach(function(c) {

    var contentString = "<a href=" + c.url + ">" + c.name + "</a><br />" + c.marker_date + " - " + c.cityName;

    var infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    if (c.is_over) {
      iconImage = 'https://maps.google.com/mapfiles/ms/icons/blue.png';
    } else {
      iconImage = 'https://maps.google.com/mapfiles/ms/icons/red.png';
    }

    c.marker = new google.maps.Marker({
      map: map,
      position: {
        lat: c.latitude_degrees,
        lng: c.longitude_degrees,
      },
      title: c.name,
      icon: iconImage
    });

    c.marker.addListener('click', function() {
      infowindow.open(map, c.marker);
    });

    markers.push(c.marker);
  });

  return markers;
};

wca.renderMarkdownRequest = function(markdownContent) {
  return wca.cancelPendingAjaxAndAjax('render_markdown', {
    url: '/render_markdown',
    data: {
      'markdown_content': markdownContent,
    },
  });
};

wca.stripHtmlTags = function(text) {
  return $("<div/>").html(text).text();
};

wca.datetimepicker = function(){
  // Copied (and modified by jfly) from
  // https://github.com/zpaulovics/datetimepicker-rails
  // We're using keepOpen: true here to allow the user to
  // "change his mind" and select a different date without
  // having to click outside and clicking on the input again.
  $datetimepicker = $('.date_picker.form-control, .datetime_picker.form-control');
  $datetimepicker.each(function() {
    var $this = $(this);
    var datetimepickerOptions = {
      useStrict: true,
      keepInvalid: true,
      useCurrent: false,
      keepOpen: true,
      sideBySide: true,
    };
    if($this.attr("name") === "user[dob]") {
      // Don't allow people to choose a birthdate in the future.
      datetimepickerOptions.maxDate = new Date();
    } else {
      // Only show the today button if we're not using dealing with a birthdate,
      // where the today button can't possibly work because today is after the maxDate
      // for the datetimepicker.
      datetimepickerOptions.showTodayButton = true;
    }
    $this.datetimepicker(datetimepickerOptions);
  });

  // Using 'blur' here, because 'change' or 'dp.change' is not fired every time
  // (see https://github.com/thewca/worldcubeassociation.org/issues/376#issuecomment-180547289).
  // Also, 'input' gets too annoying, because it flashes at every stroke until you have
  // a valid date typed.
  $datetimepicker.off('blur.wcaDateValidation').on('blur.wcaDateValidation', function() {
    var $this = $(this);
    var datetimepicker = $this.data("DateTimePicker");
    var val = $this.val();
    var valid = val === "" || moment(val, datetimepicker.format(), true).isValid();

    if(valid) {
      $this.parent().siblings('p').removeClass('alert alert-danger');
      $this.removeClass('alert-danger');
    } else {
      $this.parent().siblings('p').addClass('alert alert-danger');
      $this.parent().siblings('p').fadeIn(200).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200);
      $this.addClass('alert-danger');
    }
  });
};

$(function() {
  $('.dropdown-toggle').dropdownHover();
  $('form.are-you-sure').areYouSure();

  wca.datetimepicker();

  $('.datetimerange').each(function() {
    var $inputGroups = $(this).find('.date_picker.form-control');
    var $range1 = $inputGroups.eq(0);
    var $range2 = $inputGroups.eq(1);

    $range1.on("dp.change", function(e) {
      var startDate = $range1.data("DateTimePicker").date() || false;
      var endDate = $range2.data("DateTimePicker").date();
      $range2.data("DateTimePicker").minDate(startDate);
      if (startDate && (!endDate || endDate < startDate)) {
        $range2.data("DateTimePicker").date(startDate);
      }
    }).trigger("dp.change");
  });

  function insertText(editor, markup, promptText) {
    var cm = editor.codemirror;

    var startPoint = cm.getCursor('start');
    var endPoint = cm.getCursor('end');
    var somethingSelected = cm.somethingSelected();

    var text = (somethingSelected ? cm.getSelection() : prompt(promptText));

    if(!text) {
      return false;
    }

    cm.replaceSelection(markup.build(text));

    if(somethingSelected) {
      startPoint.ch += markup.start.length;
      endPoint.ch += markup.start.length;
      cm.setSelection(startPoint, endPoint);
    }

    cm.focus();
  }

  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
  $('input.wca-autocomplete').wcaAutocomplete();
  $('.markdown-editor').each(function() {
    var editor = new SimpleMDE({
      element: this,
      spellChecker: false,
      promptURLs: true,
      insertTexts: {
        image: ['![Image description', '](#url#)'],
      },
      toolbar: [
        'bold', 'italic', 'heading',
        '|', 'quote', 'unordered-list', 'ordered-list', 'table',
        '|', 'link', 'image',
        {
          name: 'map',
          action: function insertMap(editor) {
            var mapMarkup = {
              start: 'map(',
              end: ')',
              build: function(address) { return this.start + address + this.end; }
            };

            insertText(editor, mapMarkup, 'Address or coordinates of the place:');
          },
          className: 'fa fa-map-marker',
          title: 'Insert Map',
        },
        {
          name: 'youtube',
          action: function insertMap(editor) {
            var youTubeMarkup = {
              start: 'youtube(',
              end: ')',
              build: function(videoUrl) { return this.start + videoUrl + this.end; }
            };

            insertText(editor, youTubeMarkup, 'Full url to the YouTube video:');
          },
          className: 'fa fa-youtube-play',
          title: 'Insert YouTube Video',
        },
        '|', 'preview', 'side-by-side', 'fullscreen',
        '|', 'guide',
      ],

      // Status bar isn't quite working. See https://github.com/NextStepWebs/simplemde-markdown-editor/issues/334
      status: false,
      previewRender: function(plainText, preview) {
        if(this.markdownReqest) {
          clearTimeout(this.markdownReqest);
        }

        this.markdownReqest = setTimeout(function() {
          wca.renderMarkdownRequest(plainText).done(function(result) {
            preview.innerHTML = result;
          });
        }, TEXT_INPUT_DEBOUNCE_MS);

        return "Waiting...";
      },
    });

    // Trick to fix tab and shift+tab focus from:
    //  https://github.com/NextStepWebs/simplemde-markdown-editor/issues/122#issuecomment-176329907
    editor.codemirror.options.extraKeys.Tab = false;
    editor.codemirror.options.extraKeys['Shift-Tab'] = false;
  });

  var $tablesToFloatHeaders = $('table.floatThead');
  $tablesToFloatHeaders.floatThead({
    zIndex: 999, // Allow bootstrap popups (z-index 1000) to show up on top.
    responsiveContainer: function($table) {
      return $table.closest(".table-responsive");
    },
  });

  // After a popup actually occurs, there may be some images that need to load.
  // Here we add load listeners for those images and resize the popup once they
  // have loaded. We have to be careful not to end up in an infinite loop
  // (hence the ignoreInsert variable).
  var ignoreInsert = false;
  $('[data-toggle="popover"]').on('inserted.bs.popover', function(e) {
    var $popoverTrigger = $(e.currentTarget);
    if($popoverTrigger.data('ignoreInsert')) {
      $popoverTrigger.data('ignoreInsert', false);
      return;
    }
    $('.popover img').on('load.resizePopover', function() {
      // While waiting for the image inside the popover to load,
      // the popover may have been hidden. Only show (resize) it if
      // it's currently visible.
      // Trick to detect if popover is currently visible from:
      //  http://stackoverflow.com/a/29923760
      var popoverVisible = !!$popoverTrigger.attr('aria-describedby');
      if(!popoverVisible) {
        return;
      }
      $popoverTrigger.data('ignoreInsert', true);
      $popoverTrigger.popover('show');
    });
  });

  $("form").bind("keypress", function(e) {
    // ctrl+enter should always submit a form.
    if((e.which === 13 || e.which === 10) && e.ctrlKey) {
      // Find the submit button for this form and click it.
      // Note that we don't submit the form because that would bypass
      // any click listeners on the submit button.
      $(this).find('[type=submit]')[0].click();
    }
  });
  $("form.no-submit-on-enter").bind("keypress", function(e) {
    // We allow pressing enter inside textareas, because that only inserts
    // a newline, it doesn't submit the form.
    // Note that we let the keypress occur if ctrl is being held down, as
    // we still want ctrl+enter to submit the form.
    if(e.which === 13 && !e.ctrlKey && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });
});

// Polyfill for Math.trunc from
//  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc#Polyfill
Math.trunc = Math.trunc || function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};

// Bootstrap-table default options
$.extend($.fn.bootstrapTable.defaults, {
  searchTimeOut: TEXT_INPUT_DEBOUNCE_MS,
  trimOnSearch: false
});

// Setting up bootstrap-table
$(function() {
  $('table[data-toggle="table"]').addClass('bs-table');

  // Hide loading box
  $('.bs-table').bootstrapTable('hideLoading');

  // It's not necessary when bootstrap-table will be distributed with this merged:
  // https://github.com/wenzhixin/bootstrap-table/pull/2145
  // (and the appropriate gem will be updated)
  // -------------------------------------------------------------------
  // Triggered when a sort arrow is clicked but before a table is sorted
  $('table').on('sort.bs.table', function(e, name, order) {
    // The table column that we are sorting by
    var field = $(this).floatThead('getRowGroups').eq(0).find('th[data-field="' + name + '"] .sortable');
    // If it's not the field we are currently sorting by
    if(!field.is('.asc, .desc')) {
      // Change the sort order that's set in data-order ('asc' by default)
      var options = $(this).bootstrapTable('getOptions');
      options.sortOrder = options.columns[0].find(function(option) { return option.field == name; }).order;
      // Now the table will be sorted using the order that we set
    }
  });
  // -------------------------------------------------------------------

  // It's not necessary when bootstrap-table will be distributed with this issue solved:
  // https://github.com/wenzhixin/bootstrap-table/issues/2154
  // (and the appropriate gem will be updated)
  // -------------------------------------------------------------------
  // Prevent bootstrap-table from selecting a row when a link is clicked
  $('.bs-table td a').on('click', function(e) {
    e.stopPropagation();
  });
  // -------------------------------------------------------------------

  // Set values of checkboxes in a table to corresponding rows ids
  var initCheckboxesValues = function($table) {
    $table.find('tr td input[type="checkbox"]').each(function(index) {
      $(this).val($(this).parents('tr').attr('id'));
    });
  };
  initCheckboxesValues($('.bs-table'));
  $('table').on('post-body.bs.table', function() {
    initCheckboxesValues($(this));
    // Re-apply tooltip on each table body change
    $('[data-toggle="tooltip"]').tooltip();
  });
});

// Setting up autosize
$(function() {
  autosize($('textarea'));
});

// Helpers

// Executes the given function on the specified page/pages.
// The given string should have a format: '<controller>#<action>'.
// The action name preceded by '#' is optional.
// Could be followed by comma and another pair.
// Example: 'users#show, users#edit, users#update, competitions'.
function onPage(controllersWithActions, fun) {
  controllersWithActions = controllersWithActions.replace(/\s/g, '');
  controllersWithActions = controllersWithActions.split(',');
  controllersWithActions = controllersWithActions.map(function(controllerWithAction) { return controllerWithAction.split('#'); });
  $(function() {
    if (controllersWithActions.some(function(controllerWithAction) {
      return controllerWithAction[0] === document.body.dataset.railsControllerName &&
            (controllerWithAction[1] ? document.body.dataset.railsControllerActionName === controllerWithAction[1] : true);
    })) {
      fun();
    }
  });
}

$(function() {
  $('.wca-local-time').each(function() {
    var data = $(this).data();
    var date = new Date(data.utcTime);
    var formatted = new Intl.DateTimeFormat(data.locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
    }).format(date);
    $(this).text(formatted);
  });
});
