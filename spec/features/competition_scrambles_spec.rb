# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition scrambles page", :js do
  let!(:competition) { create(:competition, :confirmed, :visible, :results_posted, events: Event.where(id: '333')) }
  let(:person) { create(:person) }
  let!(:round) { create(:round, competition: competition, number: 2) }
  # The results nav only yields to the component when the competition has
  # results, so one is needed for the scrambles page to render at all.
  let!(:result) { create(:result, competition: competition, event_id: "333", round_type_id: "f", pos: 1, person: person, round: round) }
  let!(:scramble) { create(:scramble, competition: competition, round: round) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the ResultsDataScrambles React on Rails component" do
    visit competition_scrambles_path(competition)

    # This toggle is rendered by the ViewData component that ResultsDataScrambles
    # wraps, so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Enable admin mode")
  end
end
