import { PANEL_PAGES } from '../../lib/wca-data.js.erb';
import {
  countryBandsUrl,
  subordinateDelegateClaimsUrl,
  subordinateUpcomingCompetitionsUrl,
} from '../../lib/requests/routes.js.erb';
import PostingCompetitionsTable from '../PostingCompetitions';
import EditPerson from './pages/EditPerson';
import BannedCompetitorsPage from './pages/BannedCompetitorsPage';
import GroupsManagerAdmin from './pages/GroupsManagerAdmin';
import Translators from './pages/Translators';
import DuesExport from './pages/DuesExport';
import DelegateProbations from '../DelegateProbations';
import XeroUsers from './pages/XeroUsers';
import DuesRedirect from './pages/DuesRedirect';
import DelegateForms from './pages/DelegateForms';
import Regions from './pages/Regions';
import LeaderForms from './pages/LeaderForms';
import GroupsManager from './pages/GroupsManager';
import ImportantLinks from './pages/ImportantLinks';
import SeniorDelegatesList from './pages/SeniorDelegatesList';
import LeadersAdminPage from './pages/LeadersAdminPage';
import BoardEditorPage from './pages/BoardEditorPage';
import OfficersEditor from './pages/OfficersEditor';
import RegionsAdmin from './pages/RegionsAdmin';
import RegionManager from './pages/RegionManager';

const DELEGATE_HANDBOOK_LINK = 'https://documents.worldcubeassociation.org/edudoc/delegate-handbook/delegate-handbook.pdf';

export default {
  [PANEL_PAGES.postingDashboard]: {
    name: 'Posting Dashboard',
    component: PostingCompetitionsTable,
  },
  [PANEL_PAGES.editPerson]: {
    name: 'Edit Person',
    component: EditPerson,
  },
  [PANEL_PAGES.regionsManager]: {
    name: 'Regions Manager',
    component: RegionManager,
  },
  [PANEL_PAGES.groupsManagerAdmin]: {
    name: 'Groups Manager Admin',
    component: GroupsManagerAdmin,
  },
  [PANEL_PAGES.bannedCompetitors]: {
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
  [PANEL_PAGES.translators]: {
    name: 'Translators',
    component: Translators,
  },
  [PANEL_PAGES.duesExport]: {
    name: 'Dues Export',
    component: DuesExport,
  },
  [PANEL_PAGES.countryBands]: {
    name: 'Country Bands',
    link: countryBandsUrl,
  },
  [PANEL_PAGES.delegateProbations]: {
    name: 'Delegate Probations',
    component: DelegateProbations,
  },
  [PANEL_PAGES.xeroUsers]: {
    name: 'Xero Users',
    component: XeroUsers,
  },
  [PANEL_PAGES.duesRedirect]: {
    name: 'Dues Redirect',
    component: DuesRedirect,
  },
  [PANEL_PAGES.delegateForms]: {
    name: 'Delegate Forms',
    component: DelegateForms,
  },
  [PANEL_PAGES.regions]: {
    name: 'Regions',
    component: Regions,
  },
  [PANEL_PAGES.subordinateDelegateClaims]: {
    name: 'Subordinate Delegate Claims',
    link: subordinateDelegateClaimsUrl,
  },
  [PANEL_PAGES.subordinateUpcomingCompetitions]: {
    name: 'Subordinate Upcoming Competitions',
    link: subordinateUpcomingCompetitionsUrl,
  },
  [PANEL_PAGES.leaderForms]: {
    name: 'Leader Forms',
    component: LeaderForms,
  },
  [PANEL_PAGES.groupsManager]: {
    name: 'Groups Manager',
    component: GroupsManager,
  },
  [PANEL_PAGES.importantLinks]: {
    name: 'Important Links',
    component: ImportantLinks,
  },
  [PANEL_PAGES.delegateHandbook]: {
    name: 'Delegate Handbook',
    link: DELEGATE_HANDBOOK_LINK,
  },
  [PANEL_PAGES.seniorDelegatesList]: {
    name: 'Senior Delegates List',
    component: SeniorDelegatesList,
  },
  [PANEL_PAGES.leadersAdmin]: {
    name: 'Leaders Admin',
    component: LeadersAdminPage,
  },
  [PANEL_PAGES.boardEditor]: {
    name: 'Board Editor',
    component: BoardEditorPage,
  },
  [PANEL_PAGES.officersEditor]: {
    name: 'Officers Editor',
    component: OfficersEditor,
  },
  [PANEL_PAGES.regionsAdmin]: {
    name: 'Regions Admin',
    component: RegionsAdmin,
  },
};
