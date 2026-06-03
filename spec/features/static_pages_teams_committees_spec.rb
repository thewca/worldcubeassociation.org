# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Teams and committees page" do
  scenario "renders teams/committees fetched from the API", :js do
    visit "/teams-committees"

    # The component fetches teams_committees groups and renders a menu entry for
    # each, so the WCA Results Team name proves it rendered the API data.
    expect(page).to have_text(I18n.t("page.teams_committees_councils.groups_name.wrt"))
  end
end
