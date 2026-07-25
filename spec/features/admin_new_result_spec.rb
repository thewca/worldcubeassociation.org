# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin new result page", :js do
  let!(:competition) { create(:competition, with_rounds: true) }
  let(:round) { competition.rounds.first }

  before do
    sign_in create(:admin)
  end

  scenario "renders the EditResult/Create React on Rails component" do
    visit competition_new_result_path(competition, round)

    # This heading is rendered by the CreateEntry component that EditResult/Create
    # wraps, so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Creating a new Result")
  end
end
