# frozen_string_literal: true

require "rails_helper"

RSpec.feature "About page" do
  scenario "renders the React on Rails component", :js do
    visit "/about"

    # Mission statement text rendered by the About component.
    expect(page).to have_text("Our Purpose is to empower the global speedcubing community")
  end
end