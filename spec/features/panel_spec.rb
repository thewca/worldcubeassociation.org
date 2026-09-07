# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Panel page", :js do
  before do
    sign_in create(:admin)
  end

  scenario "renders the PanelTemplate React on Rails component" do
    visit panel_index_path(panel_id: "admin")

    # The heading is rendered by the PanelTemplate component itself (the Rails
    # view only puts it in <title>), so seeing it as page text proves the
    # React on Rails component actually mounted.
    expect(page).to have_text("Admin panel")
  end
end
