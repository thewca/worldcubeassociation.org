# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmissionController, type: :request do
  let(:delegate) { FactoryBot.create :delegate }
  let(:comp) { FactoryBot.create(:competition, delegates: [delegate]) }

  context "not logged in" do
    it "redirects to sign in" do
      get competition_submit_results_edit_path(comp.id)
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    sign_in { FactoryBot.create(:user) }

    it "redirects to home page" do
      get competition_submit_results_edit_path(comp.id)
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as a regular delegate" do
    sign_in { FactoryBot.create(:delegate) }

    it "redirects to home page" do
      get competition_submit_results_edit_path(comp.id)
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as THE delegate" do
    let(:user) { comp.delegates.first }
    let(:submission_message) { "Hello, here are the results" }
    let(:file_contents) { '{ "results": "good" }' }
    let(:file) do
      temp_file = Tempfile.new(["sometmpfilename", ".json"])
      temp_file.write(file_contents)
      temp_file.rewind
      Rack::Test::UploadedFile.new(temp_file.path, "application/json")
    end

    before :each do
      sign_in user
    end

    describe "Seeing results submission page" do
      it "returns http success" do
        get competition_submit_results_edit_path(comp.id)
        expect(response.successful?)
      end
    end

    describe "Posting results" do
      let(:results_submission_params) do
        { message: submission_message, schedule_url: "https://example.com/schedule" }
      end

      it "sends the 'results submitted' email immediately" do
        expected_results_submission = ResultsSubmission.new(results_submission_params)
        # TODO: right now ResultsSubmission accepts empty results for competition,
        # maybe we should create some fake results for a fake competition and enforce having results.
        expect(CompetitionsMailer)
          .to receive(:results_submitted)
          .with(comp, expected_results_submission, user)
          .and_call_original

        expect do
          post competition_submit_results_path(comp.id), params: { results_submission: results_submission_params }
        end.to change { ActionMailer::Base.deliveries.count }.by(1)
        assert_enqueued_jobs 0
      end

      it "does not send the email if empty message is provided" do
        expect do
          results_submission_params[:message] = ""
          post competition_submit_results_path(comp.id), params: { results_submission: results_submission_params }
        end.to change { ActionMailer::Base.deliveries.count }.by(0)
        assert_enqueued_jobs 0
      end

      it "redirects to competition page" do
        post competition_submit_results_path(comp.id), params: { results_submission: results_submission_params }

        expect(flash[:success]).not_to be_empty
        expect(response).to redirect_to(competition_path(comp))
      end
    end
  end
end
