# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin edit scramble page", :js do
  let!(:scramble) { create(:scramble) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the EditScramble React on Rails component" do
    visit edit_scramble_path(scramble)

    # This heading is rendered by the EditEntry component that EditScramble
    # wraps, so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Scramble previously saved in the database")
  end
end
