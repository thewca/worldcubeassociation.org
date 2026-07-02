# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Incidents log page", :js do
  scenario "renders the incidents log React on Rails component" do
    visit "/incidents"

    # This heading is hard-coded inside the IncidentsLog component, so seeing it
    # proves the React component actually rendered (not just the page layout).
    expect(page).to have_text("Incidents log")
  end
end
