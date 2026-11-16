# frozen_string_literal: true

require "rails_helper"

RSpec.describe "OAuth applications" do
  let(:user) { create(:user) }
  let(:admin) { create(:admin) }
  let(:application_params) { { name: "Registration service", redirect_uri: "https://example.com/callback", scopes: "public manage_registrations" } }

  describe "POST #create" do
    it "forbids a non-admin from adding the manage_registrations scope" do
      sign_in user

      expect do
        post oauth_applications_path, params: { doorkeeper_application: application_params }
      end.not_to change(Doorkeeper::Application, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it "allows a non-admin to create an application without admin-only scopes" do
      sign_in user

      expect do
        post oauth_applications_path, params: { doorkeeper_application: application_params.merge(scopes: "public email") }
      end.to change(Doorkeeper::Application, :count).by(1)
    end

    it "allows an admin to add the manage_registrations scope" do
      sign_in admin

      expect do
        post oauth_applications_path, params: { doorkeeper_application: application_params }
      end.to change(Doorkeeper::Application, :count).by(1)
    end
  end

  describe "PATCH #update" do
    it "forbids a non-admin from adding the manage_registrations scope to their application" do
      oauth_application = create(:oauth_application, owner: user, scopes: "public")
      sign_in user

      patch oauth_application_path(oauth_application), params: { doorkeeper_application: application_params }

      expect(response).to have_http_status(:forbidden)
      expect(oauth_application.reload.scopes.to_a).to eq %w[public]
    end

    it "lets a non-admin keep the manage_registrations scope an admin granted" do
      oauth_application = create(:oauth_application, owner: user, scopes: "public manage_registrations")
      sign_in user

      patch oauth_application_path(oauth_application), params: { doorkeeper_application: application_params.merge(name: "Renamed service") }

      expect(oauth_application.reload.name).to eq "Renamed service"
    end
  end
end
