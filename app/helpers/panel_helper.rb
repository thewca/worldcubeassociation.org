# frozen_string_literal: true

module PanelHelper
  def panel_list
    [
      {
        id: :admin,
        name: 'New Admin panel',
        url: Rails.application.routes.url_helpers.panel_admin_path,
      },
      {
        id: :staff,
        name: 'Staff panel',
        url: Rails.application.routes.url_helpers.panel_staff_path,
      },
      {
        id: :delegate,
        name: 'Delegate panel',
        url: Rails.application.routes.url_helpers.panel_delegate_path,
      },
      {
        id: :wfc,
        name: 'WFC panel',
        url: Rails.application.routes.url_helpers.panel_wfc_path,
      },
      {
        id: :wrt,
        name: 'WRT panel',
        url: Rails.application.routes.url_helpers.panel_wrt_path,
      },
      {
        id: :wst,
        name: 'WST panel',
        url: Rails.application.routes.url_helpers.panel_wst_path,
      },
      {
        id: :board,
        name: 'Board panel',
        url: Rails.application.routes.url_helpers.panel_board_path,
      },
      {
        id: :leader,
        name: 'Leader panel',
        url: Rails.application.routes.url_helpers.panel_leader_path,
      },
      {
        id: :senior_delegate,
        name: 'Senior Delegate panel',
        url: Rails.application.routes.url_helpers.panel_senior_delegate_path,
      },
      {
        id: :wdc,
        name: 'WDC panel',
        url: Rails.application.routes.url_helpers.panel_wdc_path,
      },
      {
        id: :wec,
        name: 'WEC panel',
        url: Rails.application.routes.url_helpers.panel_wec_path,
      },
      {
        id: :weat,
        name: 'WEAT panel',
        url: Rails.application.routes.url_helpers.panel_weat_path,
      },
    ]
  end
end
