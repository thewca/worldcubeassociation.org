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
        pages: [],
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
        pages: [],
      },
      board: {
        name: 'Board panel',
        pages: [],
      },
      leader: {
        name: 'Leader panel',
        pages: [],
      },
      senior_delegate: {
        name: 'Senior Delegate panel',
        pages: [],
      },
      wdc: {
        name: 'WDC panel',
        pages: [],
      },
      wec: {
        name: 'WEC panel',
        pages: [],
      },
      weat: {
        name: 'WEAT panel',
        pages: [],
      },
    }
  end
end
