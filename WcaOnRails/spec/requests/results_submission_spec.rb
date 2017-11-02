# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmissionController, type: :request do
  let(:delegate) { FactoryBot.create :delegate }
  let(:comp) { FactoryBot.create(:competition, delegates: [delegate]) }

  context "not logged in" do
    it "redirects to sign in" do
      get submit_results_edit_path(comp.id)
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    sign_in { FactoryBot.create(:user) }

    it "redirects to home page" do
      get submit_results_edit_path(comp.id)
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as a regular delegate" do
    sign_in { FactoryBot.create(:delegate) }

    it "redirects to home page" do
      get submit_results_edit_path(comp.id)
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as THE delegate" do
    let(:user) { comp.delegates.first }
    let(:submission_message) { "Hello, here are the results" }
    let(:file_contents) { '{ "results": "good" }' }
    let(:file) do
      temp_file = Tempfile.new("sometmpfilename.tmp")
      temp_file.write(file_contents)
      temp_file.rewind
      Rack::Test::UploadedFile.new(temp_file.path, "application/json")
    end

    before :each do
      sign_in user
    end

    describe "Seeing results submission page" do
      it "returns http success" do
        get submit_results_edit_path(comp.id)
        expect(response).to have_http_status(:success)
      end
    end

    describe "Posting results" do
      it "sends the 'results submitted' email immediately" do
        expect(CompetitionsMailer)
          .to receive(:results_submitted)
          .with(comp, submission_message, user.name, file_contents)
          .and_call_original
        post submit_results_path(comp.id), params: { competition_id: comp.id, message: submission_message, results: file }

        assert_enqueued_jobs 0
      end

      it "redirects to competition page" do
        post submit_results_path(comp.id), params: { competition_id: comp.id, message: submission_message, results: file }

        expect(flash[:success]).not_to be_empty
        expect(response).to redirect_to(competition_path(comp))
      end
    end

    describe "Posting results with missing message" do
      it "flashes an error and doesn't send an email" do
        expect {
          post submit_results_path(comp.id), params: { competition_id: comp.id, results: file }
        }.to_not change { ActionMailer::Base.deliveries.count }

        expect(flash.now[:danger]).not_to be_empty
      end
    end

    describe "Posting results with missing file" do
      it "flashes an error and doesn't send an email" do
        expect {
          post submit_results_path(comp.id), params: { competition_id: comp.id, message: submission_message }
        }.to_not change { ActionMailer::Base.deliveries.count }

        expect(flash.now[:danger]).not_to be_empty
      end
    end
  end
end
