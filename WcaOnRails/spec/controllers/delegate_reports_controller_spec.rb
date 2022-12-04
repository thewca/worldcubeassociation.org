# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DelegateReportsController do
  let(:delegate) { FactoryBot.create :delegate }
  let(:trainee_delegate) { FactoryBot.create :trainee_delegate }
  let(:comp) { FactoryBot.create(:competition, delegates: [delegate], trainee_delegates: [trainee_delegate], starts: 2.days.ago) }
  let!(:delegate_report1) { FactoryBot.create :delegate_report, competition: comp, schedule_url: "http://example.com" }
  let(:pre_delegate_reports_form_comp) { FactoryBot.create(:competition, delegates: [delegate], starts: Date.new(2015, 1, 1)) }
  let!(:delegate_report2) { FactoryBot.create :delegate_report, competition: pre_delegate_reports_form_comp, schedule_url: "http://example.com" }
  let!(:wrc_members) { FactoryBot.create_list :user, 3, :wrc_member }

  context "not logged in" do
    it "redirects to sign in" do
      get :show, params: { competition_id: comp.id }
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    sign_in { FactoryBot.create(:user) }

    it "redirects to home page" do
      get :show, params: { competition_id: comp.id }
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as a regular delegate" do
    sign_in { FactoryBot.create(:delegate) }

    it "redirects to home page" do
      get :edit, params: { competition_id: comp.id }
      expect(response).to redirect_to(root_url)
    end

    it "redirects to home page" do
      patch :update, params: { competition_id: comp.id }
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as THE delegate" do
    let!(:user) { comp.delegates.first }
    before :each do
      sign_in user
    end

    it "can view edit page" do
      get :edit, params: { competition_id: comp.id }
      expect(response.status).to eq 200
    end

    it "can edit report" do
      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My new remarks" } }
      expect(response).to redirect_to delegate_report_edit_path(comp)
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My new remarks"
    end

    it "can edit and post report before comp is over" do
      # Update comp to be in the future.
      comp.start_date = 1.day.from_now.strftime("%F")
      comp.end_date = 1.day.from_now.strftime("%F")
      comp.save!
      expect(comp.is_probably_over?).to eq false

      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My new remarks", posted: false } }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My new remarks"
      expect(comp.delegate_report.posted?).to eq false

      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My newer remarks", posted: true } }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
      expect(comp.delegate_report.posted?).to eq true
    end

    it "can post report and cannot edit report if it's posted" do
      # Update the remarks *and* set posted to true for next test.
      expect(CompetitionsMailer).to receive(:notify_of_delegate_report_submission).with(comp).and_call_original
      expect(CompetitionsMailer).to receive(:wrc_delegate_report_followup).with(comp).and_call_original
      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My newer remarks", posted: true } }
      expect(response).to redirect_to(delegate_report_path(comp))
      assert_enqueued_jobs 2
      expect(flash[:info]).to eq "Your report has been posted and emailed!"
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
      expect(comp.delegate_report.posted?).to eq true
      expect(comp.delegate_report.posted_by_user_id).to eq user.id

      # Try to update the report when it's posted.
      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My newerer remarks" } }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
    end

    it "posting report assigns two WRC users" do
      expect(comp.delegate_report.wrc_primary_user).to be_nil
      expect(comp.delegate_report.wrc_secondary_user).to be_nil
      expect(CompetitionsMailer).to receive(:wrc_delegate_report_followup).with(comp).and_call_original
      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My newer remarks", posted: true } }
      comp.delegate_report.reload
      expect(comp.delegate_report.wrc_primary_user).not_to be_nil
      expect(comp.delegate_report.wrc_secondary_user).not_to be_nil
      expect(comp.delegate_report.wrc_primary_user).not_to eq comp.delegate_report.wrc_secondary_user
    end

    it "posting report for an ancient competition doesn't send email notification" do
      # Update the remarks *and* set posted to true for next test.
      post :update, params: { competition_id: pre_delegate_reports_form_comp.id, delegate_report: { remarks: "My newer remarks", posted: true } }
      expect(response).to redirect_to(delegate_report_path(pre_delegate_reports_form_comp))
      expect(flash[:info]).to eq "Your report has been posted but not emailed because it is for a pre June 2016 competition."
      assert_enqueued_jobs 0
    end
  end

  context "logged in as THE trainee delegate" do
    let!(:user) { comp.trainee_delegates.first }
    before :each do
      sign_in user
    end

    it "can view edit page" do
      get :edit, params: { competition_id: comp.id }
      expect(response.status).to eq 200
    end

    it "can edit report" do
      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My new remarks" } }
      expect(response).to redirect_to delegate_report_edit_path(comp)
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My new remarks"
    end

    it "cannot post the report" do
      post :update, params: { competition_id: comp.id, delegate_report: { remarks: "My newer remarks", posted: true } }
      comp.reload
      expect(comp.delegate_report.posted?).to eq false
      expect(response).to redirect_to(root_url)
    end
  end
end
