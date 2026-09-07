# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Results submission page", :js do
  let!(:competition) { create(:competition, :announced) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the CompetitionResultSubmission React on Rails component" do
    visit competition_submit_results_edit_path(competition)

    # This accordion step title is rendered by the CompetitionResultSubmission
    # component, so seeing it proves the React on Rails component mounted.
    expect(page).to have_text("Import Results Data")
  end
end
