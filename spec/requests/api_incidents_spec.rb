# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Incidents" do
  let(:resolved_incident) { create(:incident, :resolved) }
  let(:pending_incident) { create(:incident) }

  describe "GET /api/v0/incidents/:id" do
    context "when logged out" do
      it "returns a resolved incident without the private fields" do
        get api_v0_incident_path(resolved_incident)

        expect(response).to be_successful
        expect(response.parsed_body["title"]).to eq resolved_incident.title
        expect(response.parsed_body).not_to have_key("private_description")
        expect(response.parsed_body).not_to have_key("private_wrc_decision")
      end

      it "does not return a pending incident" do
        get api_v0_incident_path(pending_incident)

        expect(response).to have_http_status :not_found
      end
    end

    context "when logged in as a Delegate" do
      before { sign_in create(:delegate) }

      it "returns the private fields of a resolved incident" do
        get api_v0_incident_path(resolved_incident)

        expect(response).to be_successful
        expect(response.parsed_body["private_description"]).to eq resolved_incident.private_description
        expect(response.parsed_body["private_wrc_decision"]).to eq resolved_incident.private_wrc_decision
      end

      it "does not return a pending incident" do
        get api_v0_incident_path(pending_incident)

        expect(response).to have_http_status :not_found
      end
    end

    context "when logged in as a WRC member" do
      before { sign_in create(:user, :wrc_member) }

      it "returns a pending incident" do
        get api_v0_incident_path(pending_incident)

        expect(response).to be_successful
        expect(response.parsed_body["private_wrc_decision"]).to eq pending_incident.private_wrc_decision
      end
    end

    it "returns not found for an unknown incident" do
      get api_v0_incident_path(id: 0)

      expect(response).to have_http_status :not_found
    end
  end
end
