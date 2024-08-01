# frozen_string_literal: true

module PanelHelper
  def panel_list(current_user = nil)
    panel_pages = PanelController.panel_pages
    {
      admin: {
        name: 'New Admin panel',
        pages: panel_pages.values,
      },
      staff: {
        name: 'Staff panel',
        pages: [],
      },
      delegate: {
        name: 'Delegate panel',
        pages: [
          panel_pages[:importantLinks],
          panel_pages[:delegateHandbook],
          panel_pages[:bannedCompetitors],
        ],
      },
      wfc: {
        name: 'WFC panel',
        pages: [],
      },
      wrt: {
        name: 'WRT panel',
        pages: [
          panel_pages[:postingDashboard],
          panel_pages[:editPerson],
        ],
      },
      wst: {
        name: 'WST panel',
        pages: [
          panel_pages[:translators],
        ],
      },
      board: {
        name: 'Board panel',
        pages: [
          panel_pages[:seniorDelegatesList],
          panel_pages[:leadersAdmin],
          panel_pages[:regionsManager],
          panel_pages[:delegateProbations],
          panel_pages[:groupsManagerAdmin],
          panel_pages[:boardEditor],
          panel_pages[:officersEditor],
          panel_pages[:regionsAdmin],
          panel_pages[:bannedCompetitors],
        ],
      },
      leader: {
        name: 'Leader panel',
        pages: [
          panel_pages[:leaderForms],
          panel_pages[:groupsManager],
        ],
      },
      senior_delegate: {
        name: 'Senior Delegate panel',
        pages: [
          panel_pages[:delegateForms],
          panel_pages[:regions],
          panel_pages[:delegateProbations],
          panel_pages[:subordinateDelegateClaims],
          panel_pages[:subordinateUpcomingCompetitions],
        ],
      },
      wdc: {
        name: 'WDC panel',
        pages: [
          panel_pages[:bannedCompetitors],
        ],
      },
      wec: {
        name: 'WEC panel',
        pages: [
          panel_pages[:bannedCompetitors],
          panel_pages[:downloadVoters],
        ],
      },
      weat: {
        name: 'WEAT panel',
        pages: [
          panel_pages[:bannedCompetitors],
        ],
      },
    }
  end
end
