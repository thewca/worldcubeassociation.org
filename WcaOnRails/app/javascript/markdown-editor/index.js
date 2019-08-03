import fetchWithAuthenticityToken from 'wca/fetchWithAuthenticityToken';

import EasyMDE from "easymde";
// For some reason, the SimpleMDE css file in the src directory does not seem to work,
// fortunately, the one in the dist directory *does*.
// See https://github.com/Ionaru/easy-markdown-editor/issues/108
// import "easymde/src/css/easymde.css";
import "easymde/dist/easymde.min.css";
import "./style.scss";

$(function() {
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

  $('input[name="delegate_report[wrc_feedback_requested]"]').on('change', function() {
    var feedback_requested = this.checked;
    $('div.delegate_report_wrc_incidents').toggle(feedback_requested);
    $('input#delegate_report_wrc_incidents').prop('disabled', !feedback_requested);
  }).trigger('change');

  $('input[name="delegate_report[wdc_feedback_requested]"]').on('change', function() {
    var feedback_requested = this.checked;
    $('div.delegate_report_wdc_incidents').toggle(feedback_requested);
    $('input#delegate_report_wdc_incidents').prop('disabled', !feedback_requested);
  }).trigger('change');

  $('.markdown-editor').each(function() {
    let textFormattings = ['bold', 'italic', 'heading'];
    let textStructures = ['quote', 'unordered-list', 'ordered-list', 'table'];
    let allowImageUploads = this.classList.contains("markdown-editor-image-upload");
    let uploadsAndInserts = [
      'link',
    ];
    if(allowImageUploads) {
      uploadsAndInserts.push('upload-image');
    }
    uploadsAndInserts = [
      ...uploadsAndInserts,
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
    ];
    let previews = ['preview', 'side-by-side', 'fullscreen'];
    let helps = ['guide'];
    let toolbar = [
      ...textFormattings,
      '|', ...textStructures,
      '|', ...uploadsAndInserts,
      '|', ...previews,
      '|', ...helps,
    ];
    var editor = new EasyMDE({
      element: this,
      spellChecker: false,
      promptURLs: true,
      toolbar: toolbar,
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

      status: ['upload-image'],
      uploadImage: true,
      imageUploadFunction: async function(file, onSuccess, onError) {
        let formData = new FormData();
        formData.append("image", file);
        try {
          let response = await fetchWithAuthenticityToken('/upload/image', {method: "POST", body: formData});
          let data = await response.json();
          onSuccess(data.filePath);
        } catch(e) {
          onError(e);
        }
      },
    });
    // Workaround for https://github.com/Ionaru/easy-markdown-editor/pull/109/
    editor.uploadImages = function(files, onSuccess, onError) {
      this.uploadImagesUsingCustomFunction(editor.options.imageUploadFunction, files);
    }

    // Trick to fix tab and shift+tab focus from:
    //  https://github.com/sparksuite/simplemde-markdown-editor/issues/122#issuecomment-176329907
    editor.codemirror.options.extraKeys.Tab = false;
    editor.codemirror.options.extraKeys['Shift-Tab'] = false;
  });
});
