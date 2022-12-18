# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmissionController, type: :request do
  let(:delegate) { FactoryBot.create :delegate }
  let(:comp) { FactoryBot.create(:competition, :with_valid_submitted_results, delegates: [delegate]) }

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
    let!(:user) { comp.delegates.first }
    let(:submission_message) { "Hello, here are the results" }

    before :each do
      sign_in user
    end

    describe "Seeing results submission page" do
      it "returns http success" do
        get competition_submit_results_edit_path(comp.id)
        # Checking the response status: we want a successful get without redirect.
        expect(response.status).to eq(200)
      end

      it "redirects to homepage if competition is not announced" do
        comp.update!(announced_at: nil)
        get competition_submit_results_edit_path(comp.id)
        expect(response).to redirect_to(root_url)
      end
    end

    describe "Posting results" do
      let(:results_submission_params) do
        { message: submission_message, schedule_url: "https://example.com/schedule", confirm_information: 1, competition_id: comp.id }
      end

      it "sends the 'results submitted' email immediately" do
        expected_results_submission = ResultsSubmission.new(results_submission_params)
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

      it "does not send the email if no confirmation is provided" do
        expect do
          results_submission_params.delete(:confirm_information)
          post competition_submit_results_path(comp.id), params: { results_submission: results_submission_params }
        end.to change { ActionMailer::Base.deliveries.count }.by(0)
        assert_enqueued_jobs 0
      end

      it "redirects to competition page" do
        post competition_submit_results_path(comp.id), params: { results_submission: results_submission_params }

        expect(flash[:success]).not_to be_empty
        expect(response).to redirect_to(competition_path(comp))
      end

      it "redirects to homepage if competition is not announced" do
        comp.update!(announced_at: nil)
        post competition_submit_results_path(comp.id), params: { results_submission: results_submission_params }
        expect(response).to redirect_to(root_url)
      end
    end
  end
end
