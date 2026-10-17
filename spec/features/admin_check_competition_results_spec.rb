# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin check competition results page", :js do
  let!(:competition) { create(:competition, :announced) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the CompetitionResultSubmissionCheckExistingResults React on Rails component" do
    visit competition_admin_check_existing_results_path(competition)

    # This paragraph is rendered by the CheckExistingResults component, so seeing
    # it proves the React on Rails component actually mounted.
    expect(page).to have_text("Check existing results for the competition.")
  end
end
