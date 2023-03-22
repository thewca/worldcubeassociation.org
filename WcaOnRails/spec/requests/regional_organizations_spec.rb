# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Regional Organizations management", type: :request do
  let(:regional_organization) { FactoryBot.create(:regional_organization, created_at: Time.now) }
  let(:valid_attributes) {
    {
      name: "World Cube Association",
      country: "United States",
      website: "https://www.worldcubeassociation.org/",
      logo: Rack::Test::UploadedFile.new('spec/support/logo.png', 'image/png'),
      email: "contact@worldcubeassociation.org",
      address: "Street and Number, City, State, Postal code, Country",
      bylaws: Rack::Test::UploadedFile.new('spec/support/bylaws.pdf', 'application/pdf'),
      directors_and_officers: "Directors and Officers",
      area_description: "World",
      past_and_current_activities: "Activities",
      future_plans: "Plans",
      start_date: nil,
      end_date: nil,
    }
  }

  let(:invalid_attributes) {
    {
      name: "",
      country: "",
      website: "www.worldcubeassociation.org/",
      logo: Rack::Test::UploadedFile.new('spec/support/logo.png', 'image/png'),
      email: "",
      address: "",
      bylaws: Rack::Test::UploadedFile.new('spec/support/bylaws.pdf', 'application/pdf'),
      directors_and_officers: "",
      area_description: "",
      past_and_current_activities: "",
      future_plans: "",
      start_date: Date.today,
      end_date: 3.days.ago,
    }
  }

  let!(:board_member) { FactoryBot.create(:user, :board_member) }
  let!(:user) { FactoryBot.create(:user) }

  describe "GET #index" do
    context "when logged in as a user" do
      it "shows currently acknowledged regional organizations" do
        sign_in user
        get organizations_path
        expect(response).to be_successful
      end
    end
  end

  describe "GET #admin" do
    context "when logged in as a board_member" do
      it "shows regional organizations admin panel" do
        sign_in board_member
        get admin_regional_organizations_path
        expect(response).to be_successful
      end
    end

    context "when logged in as a user" do
      it "does not allow access" do
        sign_in user
        get admin_regional_organizations_path
        expect(response).to redirect_to root_url
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
      it "does allow access" do
        sign_in board_member
        get new_regional_organization_path
        expect(response).to be_successful
      end
    end

    context "when signed in as a user" do
      it "does allow access" do
        sign_in user
        get new_regional_organization_path
        expect(response).to be_successful
      end
    end
  end

  describe "GET #edit" do
    context "when signed in as a board_member" do
      it "renders the edit page" do
        sign_in board_member
        get edit_regional_organization_path(regional_organization)
        expect(response).to be_successful
      end
    end

    context "when signed in as a user" do
      it "does not allow access" do
        sign_in user
        get edit_regional_organization_path(regional_organization)
        expect(response).to redirect_to root_url
      end
    end
  end

  describe "POST #create" do
    context "when signed in as a board member and with valid params" do
      it "creates a new regional organization" do
        sign_in board_member
        expect {
          post new_regional_organization_path, params: { regional_organization: valid_attributes }
        }.to change(RegionalOrganization, :count).by(1)
      end

      it "redirects to the created regional organization" do
        sign_in board_member
        post new_regional_organization_path, params: { regional_organization: valid_attributes }
        expect(response).to redirect_to edit_regional_organization_path(RegionalOrganization.last)
      end
    end

    context "when signed in as a board member and with invalid params" do
      it "renders the new regional organization form" do
        sign_in board_member
        expect {
          post new_regional_organization_path, params: { regional_organization: invalid_attributes }
        }.to change(RegionalOrganization, :count).by(0)
        expect(response).to be_successful
      end
    end

    context "when signed in as a user and with valid params" do
      it "creates a new regional organization" do
        sign_in user
        expect {
          post new_regional_organization_path, params: { regional_organization: valid_attributes }
        }.to change(RegionalOrganization, :count).by(1)
      end

      it "redirects to the homepage" do
        sign_in user
        post new_regional_organization_path, params: { regional_organization: valid_attributes }
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a user and with invalid params" do
      it "renders the new regional organization form" do
        sign_in user
        expect {
          post new_regional_organization_path, params: { regional_organization: invalid_attributes }
        }.to change(RegionalOrganization, :count).by(0)
        expect(response).to be_successful
      end
    end
  end

  describe "PATCH #update" do
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
        sign_in board_member
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
        sign_in board_member
        name = regional_organization.name
        patch edit_regional_organization_path(regional_organization), params: { regional_organization: invalid_attributes }
        regional_organization.reload
        expect(response).to be_successful
        expect(regional_organization.name).to eq name
      end
    end

    context "when signed in as a user" do
      it "does not allow access" do
        sign_in user
        patch edit_regional_organization_path(regional_organization), params: { regional_organization: valid_attributes }
        expect(response).to redirect_to root_url
      end
    end
  end
end
