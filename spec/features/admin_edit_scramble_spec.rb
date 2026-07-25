# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin scramble pages", :js do
  before do
    sign_in create(:admin)
  end

  scenario "renders the EditScramble React on Rails component" do
    scramble = create(:scramble)

    visit edit_scramble_path(scramble)

    # This heading is rendered by EditScramble once it has loaded the scramble,
    # so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Scramble previously saved in the database")
  end

  scenario "renders the EditScrambleCreate React on Rails component" do
    competition = create(:competition, event_ids: %w[333])
    round = create(:round, competition: competition)

    visit competition_new_scramble_path(competition, round)

    # This heading is rendered directly by EditScrambleCreate, so seeing it
    # proves the React on Rails component actually mounted.
    expect(page).to have_text("Creating a new Scramble")
  end
end
