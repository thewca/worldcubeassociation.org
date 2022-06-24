# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Incidents management", type: :request do
  let(:incident) { FactoryBot.create(:sent_incident, created_at: Time.now) }
  let(:valid_attributes) {
    {
      title: "My new incident",
      public_summary: "Public statement",
      private_description: "Private statement",
      private_wrc_decision: "Private resolution",
    }
  }

  let(:invalid_attributes) {
    {
      title: "",
      public_summary: "invalid",
      private_description: "description for invalid",
      private_wrc_decision: "resolution for invalid",
    }
  }

  let(:wrc_member) { FactoryBot.create(:user, :wrc_member) }

  describe "GET #show" do
    let!(:pending_incident) { FactoryBot.create(:incident) }

    context "when logged in as a user" do
      sign_in { FactoryBot.create(:user) }
      it "shows a resolved incident" do
        get incident_path(incident)
        expect(response).to be_successful
      end
      it "does not show a pending incident" do
        get incident_path(pending_incident)
        expect(response).to redirect_to root_url
      end
    end

    context "when logged in as a Delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "shows a pending incident" do
        get incident_path(pending_incident)
        expect(response).to be_successful
      end
    end

    context "when logged in as a WDC member" do
      sign_in { FactoryBot.create(:user, :wdc_member) }
      it "shows a pending incident" do
        get incident_path(pending_incident)
        expect(response).to be_successful
      end
    end

    context "when logged in as a WQAC member" do
      sign_in { FactoryBot.create(:user, :wqac_member) }
      it "shows a pending incident" do
        get incident_path(pending_incident)
        expect(response).to be_successful
      end
    end
  end

  describe "GET #new" do
    context "when not signed in" do
      sign_out
      it "redirects to the sign in page" do
        get new_incident_path
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        get new_incident_path
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a wrc_member" do
      before do
        sign_in wrc_member
      end
      it "shows the incident creation form" do
        get new_incident_path
        expect(response).to be_successful
      end
    end
  end

  describe "GET #edit" do
    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        get edit_incident_path(incident)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a wrc_member" do
      before do
        sign_in wrc_member
      end
      it "renders the edit page" do
        get edit_incident_path(incident)
        expect(response).to be_successful
      end
    end
  end

  describe "POST #create" do
    before :each do
      sign_in wrc_member
    end

    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        post incidents_path, params: { incident: valid_attributes }
        expect(response).to redirect_to root_url
      end
    end

    context "with valid params" do
      it "creates a new Incident" do
        expect {
          post incidents_path, params: { incident: valid_attributes }
        }.to change(Incident, :count).by(1)
      end

      it "redirects to the created incident" do
        post incidents_path, params: { incident: valid_attributes }
        expect(response).to redirect_to(Incident.last)
      end
    end

    context "with invalid params" do
      it "renders the new incident form" do
        expect {
          post incidents_path, params: { incident: invalid_attributes }
        }.to change(Incident, :count).by(0)
        expect(response).to be_successful
      end
    end
  end

  describe "PUT #update" do
    let!(:competition) { FactoryBot.create(:competition, :confirmed) }
    before :each do
      sign_in wrc_member
    end

    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        put incident_path(incident), params: { incident: {} }
        expect(response).to redirect_to root_url
      end
    end

    context "with valid params" do
      let(:new_attributes) {
        {
          tags: "a,b",
          private_wrc_decision: "Private resolution",
          incident_competitions_attributes: { '0': { competition_id: competition.id, comments: "some text" } },
        }
      }

      it "updates the requested incident and redirect to the incident" do
        incident = Incident.create! valid_attributes
        put incident_path(incident), params: { incident: new_attributes }
        expect(response).to redirect_to(incident)
        incident.reload
        expect(incident.incident_tags.map(&:tag)).to eq new_attributes[:tags].split(",")
        expect(incident.private_wrc_decision).to eq new_attributes[:private_wrc_decision]
        expect(incident.competitions.map(&:id)).to eq [competition.id]
      end
    end

    context "with invalid params" do
      it "doesn't update the incident" do
        summary = incident.public_summary
        put incident_path(incident), params: { incident: invalid_attributes }
        incident.reload
        expect(response).to be_successful
        expect(incident.public_summary).to eq summary
      end
    end
  end

  describe "DELETE #destroy" do
    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        put incident_path(incident)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WRC member" do
      it "destroys the requested incident and redirects to the incidents log" do
        sign_in wrc_member
        new_incident = FactoryBot.create(:incident)
        expect {
          delete incident_path(new_incident)
        }.to change(Incident, :count).by(-1)
        expect(response).to redirect_to(incidents_url)
      end
    end
  end

  describe "PATCH #mark_as" do
    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        patch incident_mark_as_path(incident_id: incident.id, kind: "resolved")
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WRC member" do
      before :each do
        sign_in wrc_member
      end

      it "can mark as resolved" do
        unresolved_incident = FactoryBot.create(:incident)
        expect(unresolved_incident.resolved?).to eq false
        patch incident_mark_as_path(incident_id: unresolved_incident.id, kind: "resolved")
        unresolved_incident.reload
        expect(unresolved_incident.resolved?).to eq true
        expect(response).to redirect_to(unresolved_incident)
      end

      it "can mark as digest sent" do
        resolved_incident = FactoryBot.create(:incident, :resolved, :digest_worthy)
        expect(resolved_incident.digest_missing?).to eq true
        patch incident_mark_as_path(incident_id: resolved_incident.id, kind: "sent")
        resolved_incident.reload
        expect(resolved_incident.digest_sent?).to eq true
        expect(response).to redirect_to(resolved_incident)
      end

      it "does not mark as digest sent when incident is not resolved" do
        unresolved_incident = FactoryBot.create(:incident)
        expect(unresolved_incident.resolved?).to eq false
        patch incident_mark_as_path(incident_id: unresolved_incident.id, kind: "sent")
        unresolved_incident.reload
        expect(unresolved_incident.digest_sent?).to eq false
      end
    end
  end
end
