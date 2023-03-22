# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Registration management" do
  let!(:delegate) { FactoryBot.create :delegate, name: "Jeremy on Bart" }
  let(:competition) { FactoryBot.create :competition, :with_valid_submitted_results, delegates: [delegate], name: "Submit Report 2017" }
  let!(:delegate_report) { FactoryBot.create :delegate_report, competition: competition, schedule_url: "http://example.com" }
  let!(:wrc_members) { FactoryBot.create_list :user, 3, :wrc_member }

  context "when signed in as competition delegate" do
    before :each do
      sign_in delegate
    end

    scenario "view, edit, save, submit report" do
      # View report
      visit "/competitions/#{competition.id}/report"
      expect(page).to have_text("Submit Report 2017")
      expect(page).to have_text("Your report is not posted yet")

      # Edit and save report
      click_link "Edit Report"
      fill_in "Remarks", with: "some remarks"
      click_button "Update Delegate report"
      expect(page).to have_text("some remarks")

      # Submit report
      expect(competition.reload.delegate_report.posted?).to be false
      click_button "Post the report"
      expect(page).to have_text("Report submitted by Jeremy on Bart")
      expect(competition.reload.delegate_report.posted?).to be true
    end
  end
end
