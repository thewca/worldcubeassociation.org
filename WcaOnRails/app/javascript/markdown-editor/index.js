import SimpleMDE from 'simplemde';
// For some reason, the SimpleMDE css file in the src directory does not seem to work,
// fortunately, the one in the debug directory *does*.
// See https://github.com/NextStepWebs/simplemde-markdown-editor/issues/578.
//import 'simplemde/src/css/simplemde.css';
import 'simplemde/debug/simplemde.css';

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
});
