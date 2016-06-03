require 'rails_helper'

describe DelegateReportsController do
  let(:comp) { FactoryGirl.create(:competition, :with_delegate) }

  it "factory makes a valid delegate report" do
    dr = FactoryGirl.create :delegate_report
    expect(dr).to be_valid
  end

  it "validates urls" do
    valid_urls = [
      'http://www.google.com',
      'https://www.google.com',
    ]
    invalid_urls = [
      'https://',
      'http://',
      'http://www.google.com ',
      ' http://www.google.com',
      'http://www. google.com',
      'foo.com',
      "bar",
    ]

    valid_urls.each do |valid_url|
      dr = FactoryGirl.build :delegate_report, schedule_url: valid_url, discussion_url: valid_url
      expect(dr).to be_valid
    end

    invalid_urls.each do |invalid_url|
      dr = FactoryGirl.build :delegate_report, schedule_url: invalid_url, discussion_url: nil
      expect(dr).to be_invalid

      dr = FactoryGirl.build :delegate_report, schedule_url: nil, discussion_url: invalid_url
      expect(dr).to be_invalid
    end
  end

  it "requires schedule_url but allows missing discussion_url when posted" do
    dr = FactoryGirl.build :delegate_report, schedule_url: nil, discussion_url: nil
    expect(dr).to be_valid

    dr.posted = true
    expect(dr).to be_invalid

    dr.schedule_url = "http://www.google.com"
    expect(dr).to be_valid
  end

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
      expect(flash[:info]).to eq "Your report has been posted!"
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
      expect(comp.delegate_report.posted?).to eq true
      expect(comp.delegate_report.posted_by_user_id).to eq user.id

      # Try to update the report when it's posted.
      post :update, competition_id: comp.id, delegate_report: { remarks: "My newerer remarks" }
      comp.reload
      expect(comp.delegate_report.remarks).to eq "My newer remarks"
    end
  end
end
