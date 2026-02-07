# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmissionController do
  let(:delegate) { create(:delegate) }
  let(:comp) { create(:competition, :with_valid_submitted_results, delegates: [delegate]) }

  context "not logged in" do
    it "redirects to sign in" do
      get competition_submit_results_edit_path(comp.id)
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    before { sign_in create(:user) }

    it "redirects to home page" do
      get competition_submit_results_edit_path(comp.id)
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as a regular delegate" do
    before { sign_in create(:delegate) }

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
        expect(response).to have_http_status(:ok)
      end

      it "redirects to homepage if competition is not announced" do
        comp.update!(announced_at: nil)
        get competition_submit_results_edit_path(comp.id)
        expect(response).to redirect_to(root_url)
      end
    end

    describe "Posting results" do
      let(:results_submission_params) do
        { message: submission_message, competition_id: comp.id }
      end

      it "enqueues the 'results submitted' email" do
        expect(CompetitionsMailer)
          .to receive(:results_submitted)
          .and_call_original

        expect do
          post competition_submit_results_path(comp.id), params: results_submission_params
        end.to have_enqueued_mail(CompetitionsMailer, :results_submitted)
      end

      it "throw error if empty message is provided" do
        expect do
          results_submission_params[:message] = ""
          post competition_submit_results_path(comp.id), params: results_submission_params
        end.to raise_error(ActionController::ParameterMissing)
        assert_enqueued_jobs 0
      end

      it "success" do
        post competition_submit_results_path(comp.id), params: results_submission_params

        expect(response).to have_http_status(:ok)
      end

      it "redirects to homepage if competition is not announced" do
        comp.update!(announced_at: nil)
        post competition_submit_results_path(comp.id), params: results_submission_params
        expect(response).to redirect_to(root_url)
      end
    end
  end
end
