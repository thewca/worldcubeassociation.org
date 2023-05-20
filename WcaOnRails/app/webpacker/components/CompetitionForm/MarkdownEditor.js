import React, { useMemo } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import { fetchWithAuthenticityToken } from '../../lib/requests/fetchWithAuthenticityToken';
import 'easymde/dist/easymde.min.css';

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

function getOptions(disabled) {
  const table = {
    name: 'table-custom',
    action: '\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text      | Text     |\n\n',
    title: 'Insert Table',
    className: 'fa fa-table',
  };

  const map = {
    name: 'map',
    action: (editor) => {
      const mapMarkup = {
        start: 'map(',
        end: ')',
      };

      mapMarkup.build = (address) => mapMarkup.start + address + mapMarkup.end;

      insertText(editor, mapMarkup, 'Address or coordinates of the place:');
    },
    className: 'fa fa-map-marker',
    title: 'Insert Map',
  };

  const youtube = {
    name: 'youtube',
    action: function insertMap(editor) {
      const youTubeMarkup = {
        start: 'youtube(',
        end: ')',
      };
      youTubeMarkup.build = (videoUrl) => youTubeMarkup.start + videoUrl + youTubeMarkup.end;

      insertText(editor, youTubeMarkup, 'Full url to the YouTube video:');
    },
    className: 'fa fa-youtube-play',
    title: 'Insert YouTube Video',
  };

  const textFormattings = ['bold', 'italic', 'heading'];
  const textStructures = ['quote', 'unordered-list', 'ordered-list', table];
  const uploadsAndInserts = ['link', 'upload-image', map, youtube];
  const previews = ['preview', 'side-by-side', 'fullscreen'];
  const helps = ['guide'];
  const toolbar = [
    ...textFormattings,
    '|', ...textStructures,
    '|', ...uploadsAndInserts,
    '|', ...previews,
    '|', ...helps,
  ];

  function previewRender(plainText, preview) {
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
  }

  return {
    toolbar,
    spellChecker: false,
    promptURLs: true,
    previewRender,
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
    disabled,
  };
}

export default function MarkdownEditor({ value, onChange, disabled }) {
  const options = useMemo(() => getOptions(disabled), [disabled]);
  const mdChange = (text) => onChange(text);

  return (
    <SimpleMDE
      className={disabled ? 'field disabled' : ''}
      value={value}
      onChange={mdChange}
      options={options}
    />
  );
}
