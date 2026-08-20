import EasyMDE from 'easymde';
// For some reason, the SimpleMDE css file in the src directory does not seem to work,
// fortunately, the one in the dist directory *does*.
// See https://github.com/Ionaru/easy-markdown-editor/issues/108
// import "easymde/src/css/easymde.css";
import 'easymde/dist/easymde.min.css';

import { fetchWithAuthenticityToken } from './requests/fetchWithAuthenticityToken';
import '../stylesheets/markdown-editor.scss';

$(() => {
  function insertText(editor, markup, promptText) {
    const cm = editor.codemirror;

    const startPoint = cm.getCursor('start');
    const endPoint = cm.getCursor('end');
    const somethingSelected = cm.somethingSelected();

    /* eslint-disable-next-line */
    const text = (somethingSelected ? cm.getSelection() : prompt(promptText));

    if (!text) {
      return;
    }

    cm.replaceSelection(markup.build(text));

    if (somethingSelected) {
      startPoint.ch += markup.start.length;
      endPoint.ch += markup.start.length;
      cm.setSelection(startPoint, endPoint);
    }

    cm.focus();
  }

  $('input[name="delegate_report[wrc_feedback_requested]"]').on('change', function toggleInput() {
    const feedbackRequested = this.checked;
    $('div.delegate_report_wrc_incidents').toggle(feedbackRequested);
    $('input#delegate_report_wrc_incidents').prop('disabled', !feedbackRequested);
  }).trigger('change');

  $('input[name="delegate_report[wic_feedback_requested]"]').on('change', function toggleInput() {
    const feedbackRequested = this.checked;
    $('div.delegate_report_wic_incidents').toggle(feedbackRequested);
    $('input#delegate_report_wic_incidents').prop('disabled', !feedbackRequested);
  }).trigger('change');

  $('.markdown-editor').each(function toggleInput() {
    const textFormattings = ['bold', 'italic', 'heading'];
    const textStructures = ['quote', 'unordered-list', 'ordered-list', 'table'];
    const allowImageUploads = this.classList.contains('markdown-editor-image-upload');
    let uploadsAndInserts = [
      'link',
    ];
    if (allowImageUploads) {
      uploadsAndInserts.push('upload-image');
    }
    uploadsAndInserts = [
      ...uploadsAndInserts,
      {
        name: 'map',
        action: function insertMap(editor) {
          const mapMarkup = {
            start: 'map(',
            end: ')',
            build(address) { return this.start + address + this.end; },
          };

          insertText(editor, mapMarkup, 'Address or coordinates of the place:');
        },
        className: 'fa fa-map-marker',
        title: 'Insert Map',
      },
      {
        name: 'youtube',
        action: function insertMap(editor) {
          const youTubeMarkup = {
            start: 'youtube(',
            end: ')',
            build(videoUrl) { return this.start + videoUrl + this.end; },
          };

          insertText(editor, youTubeMarkup, 'Full url to the YouTube video:');
        },
        className: 'fa fa-youtube-play',
        title: 'Insert YouTube Video',
      },
    ];
    const previews = ['preview', 'side-by-side', 'fullscreen'];
    const helps = ['guide'];
    const toolbar = [
      ...textFormattings,
      '|', ...textStructures,
      '|', ...uploadsAndInserts,
      '|', ...previews,
      '|', ...helps,
    ];
    const editor = new EasyMDE({
      element: this,
      spellChecker: false,
      promptURLs: true,
      toolbar,
      previewRender(plainText, preview) {
        const previewTarget = preview;
        if (this.markdownReqest) {
          clearTimeout(this.markdownReqest);
        }

        this.markdownReqest = setTimeout(() => {
          window.wca.renderMarkdownRequest(plainText).done((result) => {
            previewTarget.innerHTML = result;
          });
        }, window.wca.TEXT_INPUT_DEBOUNCE_MS);

        return 'Waiting...';
      },

      status: ['upload-image'],
      uploadImage: true,
      async imageUploadFunction(file, onSuccess, onError) {
        const formData = new FormData();
        formData.append('image', file);
        try {
          const response = await fetchWithAuthenticityToken('/upload/image', { method: 'POST', body: formData });
          const data = await response.json();
          onSuccess(data.filePath);
        } catch (e) {
          onError(e);
        }
      },
    });

    // Manually trigger change to original textarea so are-you-sure can be utilized
    editor.codemirror.on('change', () => {
      this.value = editor.value();
      $(this).trigger('change');
    });
    // So edited value does not persist on refresh
    editor.value(this.defaultValue);

    // Trick to fix tab and shift+tab focus from:
    //  https://github.com/sparksuite/simplemde-markdown-editor/issues/122#issuecomment-176329907
    editor.codemirror.options.extraKeys.Tab = false;
    editor.codemirror.options.extraKeys['Shift-Tab'] = false;
  });
});
