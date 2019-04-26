# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Regional Organizations management", type: :request do
  let(:regional_organization) { FactoryBot.create(:regional_organization, created_at: Time.now) }
  let(:valid_attributes) {
    {
      name: "World Cube Association",
      country: "United States",
      website: "https://www.worldcubeassociation.org/",
      start_date: Date.today,
      end_date: nil,
    }
  }

  let(:invalid_attributes) {
    {
      name: "",
      country: "",
      website: "www.worldcubeassociation.org/",
      start_date: nil,
      end_date: 3.days.ago,
    }
  }

  let(:board_member) { FactoryBot.create(:user, :board_member) }
  let(:delegate) { FactoryBot.create(:delegate) }

  describe "GET #index" do
    context "when logged in as a user" do
      sign_in { FactoryBot.create(:user) }
      it "shows currently acknowledged regional organizations" do
        get organizations_path
        expect(response).to be_successful
      end
    end
  end

  describe "GET #list" do
    context "when logged in as a board_member" do
      before do
        sign_in board_member
      end
      it "shows regional organizations list" do
        get admin_regional_organizations_path
        expect(response).to be_successful
      end
    end

    context "when logged in as a user" do
      sign_in { FactoryBot.create(:user) }
      it "does not allow access" do
        get organizations_path
        expect(response).to be_successful
      end
    end
  end

  describe "GET #new" do
    context "when not signed in" do
      sign_out
      it "redirects to the sign in page" do
        get new_regional_organization_path
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as a board member" do
      before do
        sign_in board_member
      end
      it "does allow access" do
        get new_regional_organization_path
        expect(response).to be_successful
      end
    end

    context "when signed in as a delegate" do
      before do
        sign_in delegate
      end
      it "does not allow access" do
        get new_regional_organization_path
        expect(response).to redirect_to root_url
      end
    end
  end

  describe "GET #edit" do
    context "when signed in as a board_member" do
      before do
        sign_in board_member
      end
      it "renders the edit page" do
        get edit_regional_organization_path(regional_organization)
        expect(response).to be_successful
      end
    end

    context "when signed in as a delegate" do
      before do
        sign_in delegate
      end
      it "does not allow access" do
        get edit_regional_organization_path(regional_organization)
        expect(response).to redirect_to root_url
      end
    end
  end

  describe "POST #create" do
    before :each do
      sign_in board_member
    end

    context "with valid params" do
      it "creates a new regional organization" do
        expect {
          post new_regional_organization_path, params: { regional_organization: valid_attributes }
        }.to change(RegionalOrganization, :count).by(1)
      end

      it "redirects to the created regional organization" do
        post new_regional_organization_path, params: { regional_organization: valid_attributes }
        expect(response).to redirect_to edit_regional_organization_path(RegionalOrganization.last)
      end
    end

    context "with invalid params" do
      it "renders the new regional organization form" do
        expect {
          post new_regional_organization_path, params: { regional_organization: invalid_attributes }
        }.to change(RegionalOrganization, :count).by(0)
        expect(response).to be_successful
      end
    end

    context "when signed in as a delegate" do
      before do
        sign_in delegate
      end
      it "does not allow access" do
        post new_regional_organization_path, params: { regional_organization: valid_attributes }
        expect(response).to redirect_to root_url
      end
    end
  end

  describe "PATCH #update" do
    before :each do
      sign_in board_member
    end

    context "with valid params" do
      let(:new_attributes) {
        {
          name: "World Speedcubing Association",
          country: "China",
          website: "https://www.worldspeedcubingassociation.org/",
          start_date: Date.today,
          end_date: nil,
        }
      }

      it "updates the requested requested regional organization and redirects to the regional organization" do
        regional_organization = RegionalOrganization.create! valid_attributes
        patch edit_regional_organization_path(regional_organization), params: { regional_organization: new_attributes }
        expect(response).to redirect_to edit_regional_organization_path(regional_organization)
        regional_organization.reload
        expect(regional_organization.name).to eq new_attributes[:name]
        expect(regional_organization.country).to eq new_attributes[:country]
        expect(regional_organization.website).to eq new_attributes[:website]
      end
    end

    context "with invalid params" do
      it "doesn't update the regional organization" do
        name = regional_organization.name
        patch edit_regional_organization_path(regional_organization), params: { regional_organization: invalid_attributes }
        regional_organization.reload
        expect(response).to be_successful
        expect(regional_organization.name).to eq name
      end
    end

    context "when signed in as a delegate" do
      before do
        sign_in delegate
      end
      it "does not allow access" do
        patch edit_regional_organization_path(regional_organization), params: { regional_organization: valid_attributes }
        expect(response).to redirect_to root_url
      end
    end
  end
end
