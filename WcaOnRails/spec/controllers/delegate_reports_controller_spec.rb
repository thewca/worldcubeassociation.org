require 'rails_helper'

describe DelegateReportsController do
  let(:comp) { FactoryGirl.create(:competition, :with_delegate) }

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
    before :each do
      sign_in comp.delegates.first
    end
    it "can view edit page" do
      get :edit, competition_id: comp.id
      expect(response.status).to eq 200
    end
    it "can edit report" do
      post :update, competition_id: comp.id, delegate_report: { content: "My new content" }
      expect(response).to redirect_to(competition_report_edit_path(comp))
      comp.reload
      expect(comp.delegate_report.content).to eq "My new content"
    end
    it "cannot edit report if it's posted" do
      # Update the content *and* set posted to true for next test
      post :update, competition_id: comp.id, delegate_report: { content: "My newer content", posted: true }
      expect(response).to redirect_to(competition_report_path(comp))
      comp.reload
      expect(comp.delegate_report.content).to eq "My newer content"
      expect(comp.delegate_report.posted).to eq true

      # Try to update the content when it's posted
      post :update, competition_id: comp.id, delegate_report: { content: "My newerer content" }
      comp.reload
      expect(comp.delegate_report.content).to eq "My newer content"
    end
  end

end
