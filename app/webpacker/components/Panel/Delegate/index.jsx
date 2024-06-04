import React from 'react';
import PanelTemplate from '../PanelTemplate';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';
import ImportantLinks from './ImportantLinks';
import BannedCompetitorsPage from '../pages/BannedCompetitorsPage';

const delegateCrashCourseLink = 'https://documents.worldcubeassociation.org/edudoc/delegate-crash-course/delegate_crash_course.pdf';

const sections = [
  {
    id: PANEL_LIST.delegate.importantLinks,
    name: 'Important Links',
    component: ImportantLinks,
  },
  {
    id: PANEL_LIST.delegate.delegateCrashCourse,
    name: 'Delegate Crash Course',
    link: delegateCrashCourseLink,
  },
  {
    id: PANEL_LIST.delegate.bannedCompetitors,
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
];

export default function Delegate() {
  return (
    <PanelTemplate heading="Delegate Panel" sections={sections} />
  );
}
