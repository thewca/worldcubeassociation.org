// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

import '../lib/image-preview';
import '../lib/polyfills';
import autosize from 'autosize';
import Rails from '@rails/ujs';
import {
  getUrlParams,
  setUrlParams,
  formattedTextForDate,
} from '../lib/utils/wca';
import '../lib/acknowledge-cookies';

Rails.start();
require('jquery');

// Build up the window.wca environment
window.wca = window.wca || {};

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

// Support component names relative to this directory:
const componentRequireContext = require.context('components', true);
const ReactRailsUJS = require('react_ujs');

// see: https://github.com/reactjs/react-rails#component-name
// eslint-disable-next-line react-hooks/rules-of-hooks
ReactRailsUJS.useContext(componentRequireContext);
