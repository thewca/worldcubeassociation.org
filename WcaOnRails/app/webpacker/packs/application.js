/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

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
