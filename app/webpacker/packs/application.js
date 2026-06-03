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
import ReactOnRails from 'react-on-rails';
import Disclaimer from '../react_on_rails_components/StaticPages/Disclaimer';
import About from '../react_on_rails_components/StaticPages/About';
import Logo from '../react_on_rails_components/StaticPages/Logo';
import OfficersAndBoard from '../react_on_rails_components/OfficersAndBoard';
import Delegates from '../react_on_rails_components/Delegates';
import TeamsCommitteesCouncils from '../react_on_rails_components/TeamsCommitteesCouncils';
import Translators from '../react_on_rails_components/Translators';
import PersonsList from '../react_on_rails_components/Persons/List';
import UsersList from '../react_on_rails_components/Users/List';
import ResultsRankings from '../react_on_rails_components/Results/Rankings';
import ResultsRecords from '../react_on_rails_components/Results/Records';
import RegionalOrganizations from '../react_on_rails_components/RegionalOrganizations';
import IncidentsLog from '../react_on_rails_components/IncidentsLog';
import ContactsPage from '../react_on_rails_components/ContactsPage';
import ContactEditProfilePage from '../react_on_rails_components/ContactEditProfilePage';
import {
  getUrlParams,
  setUrlParams,
  formattedTextForDate,
} from '../lib/utils/wca';
import '../lib/acknowledge-cookies';
import { i18nReady } from '../lib/i18n';

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

ReactOnRails.register({
  StaticPagesDisclaimer: Disclaimer,
  StaticPagesAbout: About,
  StaticPagesLogo: Logo,
  OfficersAndBoard,
  Delegates,
  TeamsCommitteesCouncils,
  Translators,
  PersonsList,
  UsersList,
  ResultsRankings,
  ResultsRecords,
  RegionalOrganizations,
  IncidentsLog,
  ContactsPage,
  ContactEditProfilePage,
});

// Support component names relative to this directory:
const componentRequireContext = require.context('components', true);
const ReactRailsUJS = require('react_ujs');

// see: https://github.com/reactjs/react-rails#component-name
// eslint-disable-next-line react-hooks/rules-of-hooks
ReactRailsUJS.useContext(componentRequireContext);

// Delay component mounting until translations for the user's locale are ready.
// English is always available synchronously; other locales load as a small separate chunk.
const originalHandleMount = ReactRailsUJS.handleMount.bind(ReactRailsUJS);
ReactRailsUJS.handleMount = (e) => {
  i18nReady.then(() => originalHandleMount(e));
};
