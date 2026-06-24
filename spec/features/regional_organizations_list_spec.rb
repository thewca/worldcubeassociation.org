# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Regional organizations page", :js do
  scenario "renders the regional organizations React on Rails component" do
    visit "/organizations"

    # This heading is hard-coded inside the RegionalOrganizations component (it is
    # not the page title), so seeing it proves the React component actually rendered.
    expect(page).to have_text(I18n.t("regional_organizations.how_to.title"))
  end
end
