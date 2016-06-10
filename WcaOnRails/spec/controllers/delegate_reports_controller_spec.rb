require 'rails_helper'

describe DelegateReportsController do
  let(:delegate) { FactoryGirl.create :delegate }
  let(:comp) { FactoryGirl.create(:competition, delegates: [delegate], starts: 1.day.ago) }
  let(:pre_delegate_reports_form_comp) { FactoryGirl.create(:competition, delegates: [delegate], starts: Date.new(2015, 1, 1)) }

  context "not logged in" do
    it "redirects to sign in" do
      get :show, competition_id: comp.id
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    sign_in { FactoryGirl.create(:user) }

    it "redirects to home page" do
      get :show, competition_id: comp.id
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as a regular delegate" do
    sign_in { FactoryGirl.create(:delegate) }

    it "redirects to home page" do
      get :edit, competition_id: comp.id
      expect(response).to redirect_to(root_url)
    end

    it "redirects to home page" do
      patch :update, competition_id: comp.id
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as THE delegate" do
    let(:user) { comp.delegates.first }
    before :each do
      sign_in user
    end

    it "can view edit page" do
      get :edit, competition_id: comp.id
      expect(response.status).to eq 200
    end

    it "can edit report" do
      post :update, competition_id: comp.id, delegate_report: { remarks: "My new remarks" }
      expect(response).to redirect_to delegate_report_edit_path(comp)
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My new remarks"
    end

    it "can edit report before comp is over, but cannot post report" do
      # Update comp to be in the future.
      comp.start_date = 1.day.from_now.strftime("%F")
      comp.end_date = 1.day.from_now.strftime("%F")
      comp.save!

      post :update, competition_id: comp.id, delegate_report: { remarks: "My new remarks", posted: false }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My new remarks"
      expect(comp.delegate_report.posted?).to eq false

      post :update, competition_id: comp.id, delegate_report: { remarks: "My newer remarks", posted: true }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My new remarks"
      expect(comp.delegate_report.posted?).to eq false
    end

    it "can post report and cannot edit report if it's posted" do
      # Update the remarks *and* set posted to true for next test.
      expect(CompetitionsMailer).to receive(:notify_of_delegate_report_submission).with(comp).and_call_original
      post :update, competition_id: comp.id, delegate_report: { remarks: "My newer remarks", schedule_url: "http://example.com", posted: true }
      expect(response).to redirect_to(delegate_report_path(comp))
      assert_enqueued_jobs 1
      expect(flash[:info]).to eq "Your report has been posted and emailed!"
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
      expect(comp.delegate_report.posted?).to eq true
      expect(comp.delegate_report.posted_by_user_id).to eq user.id
      # Check if the discussion_url was set
      expect(comp.delegate_report.discussion_url).to eq "https://groups.google.com/forum/#!topicsearchin/wca-delegates/" + URI.encode(comp.name)

      # Try to update the report when it's posted.
      post :update, competition_id: comp.id, delegate_report: { remarks: "My newerer remarks" }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
    end

    it "posting report for an ancient competition doesn't send email notification" do
      # Update the remarks *and* set posted to true for next test.
      post :update, competition_id: pre_delegate_reports_form_comp.id, delegate_report: { remarks: "My newer remarks", schedule_url: "http://example.com", posted: true }
      expect(response).to redirect_to(delegate_report_path(pre_delegate_reports_form_comp))
      expect(flash[:info]).to eq "Your report has been posted but not emailed because it is for a pre June 2016 competition."
      assert_enqueued_jobs 0
    end
  end
end
