# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Disclaimer page" do
  scenario "renders the React on Rails component", :js do
    visit "/disclaimer"

    # Text hard-coded inside the Disclaimer component (not in the page title),
    # so seeing it proves the React component actually rendered.
    expect(page).to have_text("sponsorship and partnership agreements")
  end
end