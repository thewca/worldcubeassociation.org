# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin result pages", :js do
  before do
    sign_in create(:admin)
  end

  scenario "renders the EditResult React on Rails component" do
    result = create(:result)

    visit edit_result_path(result)

    # This heading is rendered by EditResult once it has loaded the result, so
    # seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Result previously saved in the database")
  end

  scenario "renders the EditResultCreate React on Rails component" do
    competition = create(:competition, event_ids: %w[333])
    round = create(:round, competition: competition)

    visit competition_new_result_path(competition, round)

    # This heading is rendered directly by EditResultCreate, so seeing it proves
    # the React on Rails component actually mounted.
    expect(page).to have_text("Creating a new Result")
  end
end
