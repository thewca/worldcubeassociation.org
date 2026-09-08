# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin upload results page", :js do
  let!(:result_ticket) { create(:tickets_competition_result) }
  let(:competition) { result_ticket.competition }

  before do
    sign_in create(:admin)
  end

  scenario "renders the CompetitionResultSubmissionAdmin React on Rails component" do
    visit competition_admin_upload_results_edit_path(competition)

    # This tab title comes from the ImportResultsData component that
    # CompetitionResultSubmissionAdmin renders, so seeing it proves the React on
    # Rails component actually mounted.
    expect(page).to have_text("Upload Results JSON")
  end
end
