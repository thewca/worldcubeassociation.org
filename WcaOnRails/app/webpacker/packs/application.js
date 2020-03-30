/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

import 'flag-icon-css/css/flag-icon.css';
import '../javascript/image-preview';
import '../javascript/polyfills';
import '../javascript/incidents-log';
import autosize from 'autosize';
import {
  getUrlParams,
  setUrlParams,
  formattedTextForDate,
} from '../javascript/wca/utils';

import { attachComponentToElem } from '../javascript/wca/react-utils';

require('@rails/ujs').start();
require('jquery');

// Build up the window.wca environment, which we use to store our components.
window.wca = window.wca || {};
window.wca.components = {};
window.wca.attachComponentToElem = attachComponentToElem;

// FIXME: refactor?
// NOTE: We *need* to import only the components we want to use.
// The full Semantic/Fomantic UI css is 1.6 MB minified at the time of writing.
// There is no way it's reasonable to add that to our frontpage, given we use
// only a small subset of components.
// The goal is to "import" (which for CSS is actually "declare to webpacker
// we want to use that dependency) the components used site-wide, and import
// other components on a need-per-pack basis.
// Webpacker will then do the maths and chunk that appropriately.
import '../stylesheets/semantic/components/site.css';
import '../stylesheets/semantic/components/site.js';
import '../stylesheets/semantic/components/container.css';
import '../stylesheets/semantic/components/header.css';
import '../stylesheets/semantic/components/list.css';
import '../stylesheets/semantic/components/item.css';
import '../stylesheets/semantic/components/image.css';
import '../stylesheets/semantic/components/icon.css';
import '../stylesheets/semantic/components/grid.css';
import '../stylesheets/semantic/components/reset.css';
import '../stylesheets/semantic/components/segment.css';
import '../stylesheets/semantic/components/button.css';
import '../stylesheets/override.scss';
import '../stylesheets/homepage.scss';

// Setting up autosize
$(() => {
  autosize($('textarea:not(.no-autosize)'));
  // Setup wca-local-time users
  $('.wca-local-time').each(function init() {
    const data = $(this).data();
    const { utcTime, locale } = data;
    $(this).text(formattedTextForDate(utcTime, locale));
  });
});

// Export some helpers
window.wca.getUrlParams = getUrlParams;
window.wca.setUrlParams = setUrlParams;
