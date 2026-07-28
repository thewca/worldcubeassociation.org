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
import MyCompetitions from '../react_on_rails_components/MyCompetitions';
import PostsWidget from '../react_on_rails_components/Posts/PostsWidget';
import CreatePost from '../react_on_rails_components/Posts/CreatePost';
import EditPost from '../react_on_rails_components/Posts/EditPost';
import LivestreamManager from '../react_on_rails_components/Posts/LivestreamManager';
import CompetitionsOverview from '../react_on_rails_components/CompetitionsOverview';
import EventsTable from '../react_on_rails_components/EventsTable';
import ManualPaymentSetup from '../react_on_rails_components/ManualPaymentSetup';
import EditAvatar from '../react_on_rails_components/EditAvatar';
import ImportRegistrations from '../react_on_rails_components/ImportRegistrations';
import UserAvatar from '../react_on_rails_components/UserAvatar';
import Schedule from '../react_on_rails_components/Schedule';
import EditSchedule from '../react_on_rails_components/EditSchedule';
import ScrambleMatcher from '../react_on_rails_components/ScrambleMatcher';
import EditScramble from '../react_on_rails_components/EditScramble';
import EditScrambleCreate from '../react_on_rails_components/EditScramble/Create';
import EditResult from '../react_on_rails_components/EditResult';
import EditResultCreate from '../react_on_rails_components/EditResult/Create';
import EditEvents from '../react_on_rails_components/EditEvents';
import CompetitionResultSubmission from '../react_on_rails_components/CompetitionResultSubmission';
import CompetitionResultSubmissionAdmin from '../react_on_rails_components/CompetitionResultSubmission/Admin';
import CompetitionResultSubmissionCheckExistingResults from '../react_on_rails_components/CompetitionResultSubmission/CheckExistingResults';
import NewcomerChecksPage from '../react_on_rails_components/NewcomerChecks';
import ResultsDataResults from '../react_on_rails_components/ResultsData/Results';
import ResultsDataScrambles from '../react_on_rails_components/ResultsData/Scrambles';
import RolesTab from '../react_on_rails_components/RolesTab';
import PersonsBadges from '../react_on_rails_components/Persons/Badges';
import RegistrationsList from '../react_on_rails_components/Registrations/List';
import RegistrationsEdit from '../react_on_rails_components/Registrations/Edit';
import RegistrationsRegister from '../react_on_rails_components/Registrations/Register';
import RegistrationsAdministration from '../react_on_rails_components/Registrations/Administration';
import CompetitionFormEdit from '../react_on_rails_components/CompetitionForm/Edit';
import CompetitionFormCreate from '../react_on_rails_components/CompetitionForm/Create';
import PanelTemplate from '../react_on_rails_components/Panel/PanelTemplate';
import Tickets from '../react_on_rails_components/Tickets';
import SearchWidget from '../react_on_rails_components/SearchWidget';
import {
  getUrlParams,
  setUrlParams,
  formattedTextForDate,
} from '../lib/utils/wca';
import '../lib/acknowledge-cookies';
import '../lib/i18n';

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
  MyCompetitions,
  PostsWidget,
  CreatePost,
  EditPost,
  LivestreamManager,
  CompetitionsOverview,
  EventsTable,
  ManualPaymentSetup,
  EditAvatar,
  ImportRegistrations,
  UserAvatar,
  Schedule,
  EditSchedule,
  ScrambleMatcher,
  EditScramble,
  EditScrambleCreate,
  EditResult,
  EditResultCreate,
  EditEvents,
  CompetitionResultSubmission,
  CompetitionResultSubmissionAdmin,
  CompetitionResultSubmissionCheckExistingResults,
  NewcomerChecks: NewcomerChecksPage,
  ResultsDataResults,
  ResultsDataScrambles,
  RolesTab,
  PersonsBadges,
  RegistrationsList,
  RegistrationsEdit,
  RegistrationsRegister,
  RegistrationsAdministration,
  CompetitionFormEdit,
  CompetitionFormCreate,
  PanelTemplate,
  Tickets,
  SearchWidget,
});
