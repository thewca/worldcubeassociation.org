# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin new scramble page", :js do
  let!(:competition) { create(:competition, :with_rounds) }
  let(:round) { competition.rounds.first }

  before do
    sign_in create(:admin)
  end

  scenario "renders the EditScramble/Create React on Rails component" do
    visit new_scramble_path(competition_id: competition.id, round_id: round.id)

    # This heading is rendered by the CreateEntry component that EditScramble/Create
    # wraps, so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Creating a new Scramble")
  end
end
