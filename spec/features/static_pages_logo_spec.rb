# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Logo page" do
  scenario "renders the React on Rails component", :js do
    visit "/logo"

    # Heading rendered inside the Logo component.
    expect(page).to have_text("Usage Guidelines")
  end
end
