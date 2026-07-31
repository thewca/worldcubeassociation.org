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

  describe "PATCH /api/v0/incidents/:incident_id/mark_as/:kind" do
    context "when logged in as a WRC member" do
      before { sign_in create(:user, :wrc_member) }

      it "publishes a pending incident" do
        patch api_v0_incident_mark_as_path(incident_id: pending_incident.id, kind: "resolved")

        expect(response).to be_successful
        expect(pending_incident.reload).to be_resolved
      end

      it "unpublishes a resolved incident" do
        patch api_v0_incident_mark_as_path(incident_id: resolved_incident.id, kind: "unresolve")

        expect(response).to be_successful
        expect(resolved_incident.reload).not_to be_resolved
      end

      it "rejects an unrecognized kind" do
        patch api_v0_incident_mark_as_path(incident_id: resolved_incident.id, kind: "sent")

        expect(response).to have_http_status :bad_request
        expect(resolved_incident.reload).to be_resolved
      end
    end

    context "when logged in as a Delegate" do
      before { sign_in create(:delegate) }

      it "does not allow publishing" do
        patch api_v0_incident_mark_as_path(incident_id: pending_incident.id, kind: "resolved")

        expect(response).to have_http_status :forbidden
        expect(pending_incident.reload).not_to be_resolved
      end
    end

    context "when logged out" do
      it "does not allow publishing" do
        patch api_v0_incident_mark_as_path(incident_id: pending_incident.id, kind: "resolved")

        expect(response).to have_http_status :unauthorized
        expect(pending_incident.reload).not_to be_resolved
      end
    end
  end

  describe "DELETE /api/v0/incidents/:id" do
    context "when logged in as a WRC member" do
      before { sign_in create(:user, :wrc_member) }

      it "destroys the incident" do
        incident = resolved_incident

        expect { delete api_v0_incident_path(incident) }.to change(Incident, :count).by(-1)
        expect(response).to be_successful
      end
    end

    context "when logged in as a Delegate" do
      before { sign_in create(:delegate) }

      it "does not allow destroying" do
        incident = resolved_incident

        expect { delete api_v0_incident_path(incident) }.not_to change(Incident, :count)
        expect(response).to have_http_status :forbidden
      end
    end
  end
end
