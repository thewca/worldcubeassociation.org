import { PANEL_PAGES } from '../../lib/wca-data.js.erb';
import PostingCompetitionsTable from '../PostingCompetitions';
import RegionManager from './Board/RegionManager';
import EditPerson from './Wrt/EditPerson';
import BannedCompetitorsPage from './pages/BannedCompetitorsPage';
import GroupsManagerAdmin from './pages/GroupsManagerAdmin';
import Translators from './pages/Translators';

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
};
