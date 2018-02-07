# frozen_string_literal: true

require 'rails_helper'

RSpec.describe IncidentsController, type: :controller do
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

  describe "GET #index" do
    let!(:incident1) { FactoryBot.create(:incident, :resolved, title: "Incident 1", created_at: 1.day.ago) }
    let!(:incident2) { FactoryBot.create(:incident, title: "Incident 2 not resolved", created_at: 3.days.ago) }
    let!(:incident3) { FactoryBot.create(:sent_incident, tags: ["test"], title: "Incident #3", created_at: 1.week.ago) }

    context "when logged out" do
      sign_out
      it "shows only resolved incident" do
        get :index
        expect(assigns(:incidents)).to eq [incident, incident1, incident3]
      end
    end

    context "when logged in as a Delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "shows all incidents" do
        get :index
        expect(assigns(:incidents)).to eq [incident, incident1, incident2, incident3]
      end
    end

    context "when logged in as a user" do
      sign_in { FactoryBot.create(:user) }
      it "shows only resolved incident" do
        get :index
        expect(assigns(:incidents)).to eq [incident, incident1, incident3]
      end
    end
  end

  describe "GET #show" do
    let!(:pending_incident) { FactoryBot.create(:incident) }

    context "when logged in as a user" do
      sign_in { FactoryBot.create(:user) }
      it "shows a resolved incident" do
        get :show, params: { id: incident.id }
        expect(response).to be_success
      end
      it "does not show a pending incident" do
        get :show, params: { id: pending_incident.id }
        expect(response).to redirect_to root_url
      end
    end

    context "when logged in as a Delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "shows a pending incident" do
        get :show, params: { id: pending_incident.id }
        expect(response).to be_success
      end
    end

    context "when logged in as a WDC member" do
      sign_in { FactoryBot.create(:user, :wdc_member) }
      it "shows a pending incident" do
        get :show, params: { id: pending_incident.id }
        expect(response).to be_success
      end
    end

    context "when logged in as a WQAC member" do
      sign_in { FactoryBot.create(:user, :wqac_member) }
      it "shows a pending incident" do
        get :show, params: { id: pending_incident.id }
        expect(response).to be_success
      end
    end
  end

  describe "GET #new" do
    context "when not signed in" do
      sign_out
      it "redirects to the sign in page" do
        get :new
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        get :new
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a wrc_member" do
      before do
        sign_in wrc_member
      end
      it "shows the incident creation form" do
        get :new
        expect(response).to render_template :new
      end
    end
  end

  describe "GET #edit" do
    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        get :edit, params: { id: incident.id }
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a wrc_member" do
      before do
        sign_in wrc_member
      end
      it "renders the edit page" do
        get :edit, params: { id: incident.id }
        expect(response).to render_template :edit
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
        post :create, params: { incident: valid_attributes }
        expect(response).to redirect_to root_url
      end
    end

    context "with valid params" do
      it "creates a new Incident" do
        expect {
          post :create, params: { incident: valid_attributes }
        }.to change(Incident, :count).by(1)
      end

      it "redirects to the created incident" do
        post :create, params: { incident: valid_attributes }
        expect(response).to redirect_to(Incident.last)
      end
    end

    context "with invalid params" do
      it "renders the new incident form" do
        post :create, params: { incident: invalid_attributes }
        expect(response).to be_success
        expect(response).to render_template :new
        new_incident = assigns(:incident)
        expect(new_incident.errors.messages[:title]).to eq ["can't be blank"]
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
        put :update, params: { id: incident.id, incident: {} }
        expect(response).to redirect_to root_url
      end
    end

    context "with valid params" do
      let(:new_attributes) {
        {
          tags: "a,b",
          private_wrc_decision: "Private resolution",
          incident_competitions_attributes: { "0": { competition_id: competition.id, comments: "some text" } },
        }
      }

      it "updates the requested incident and redirect to the incident" do
        incident = Incident.create! valid_attributes
        put :update, params: { id: incident.id, incident: new_attributes }
        expect(response).to redirect_to(incident)
        incident.reload
        expect(incident.incident_tags.map(&:tag)).to eq new_attributes[:tags].split(",")
        expect(incident.private_wrc_decision).to eq new_attributes[:private_wrc_decision]
        expect(incident.competitions.map(&:id)).to eq [competition.id]
      end
    end

    context "with invalid params" do
      it "returns the edit template and doesn't update the incident" do
        summary = incident.public_summary
        put :update, params: { id: incident.id, incident: invalid_attributes }
        incident.reload
        expect(response).to be_success
        expect(incident.public_summary).to eq summary
      end
    end
  end

  describe "DELETE #destroy" do
    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        put :update, params: { id: incident.id, incident: {} }
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WRC member" do
      it "destroys the requested incident and redirects to the incident list" do
        sign_in wrc_member
        new_incident = FactoryBot.create(:incident)
        expect {
          delete :destroy, params: { id: new_incident.id }
        }.to change(Incident, :count).by(-1)
        expect(response).to redirect_to(incidents_url)
      end
    end
  end

  describe "PATCH #mark_as" do
    context "when signed in as a delegate" do
      sign_in { FactoryBot.create(:delegate) }
      it "does not allow access" do
        patch :mark_as, params: { incident_id: incident.id, kind: "resolved" }
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
        patch :mark_as, params: { incident_id: unresolved_incident.id, kind: "resolved" }
        unresolved_incident.reload
        expect(unresolved_incident.resolved?).to eq true
        expect(response).to redirect_to(unresolved_incident)
      end

      it "can mark as digest sent" do
        resolved_incident = FactoryBot.create(:incident, :resolved, :digest_worthy)
        expect(resolved_incident.digest_missing?).to eq true
        patch :mark_as, params: { incident_id: resolved_incident.id, kind: "sent" }
        resolved_incident.reload
        expect(resolved_incident.digest_sent?).to eq true
        expect(response).to redirect_to(resolved_incident)
      end

      it "does not mark as digest sent when incident is not resolved" do
        unresolved_incident = FactoryBot.create(:incident)
        expect(unresolved_incident.resolved?).to eq false
        patch :mark_as, params: { incident_id: unresolved_incident.id, kind: "sent" }
        unresolved_incident.reload
        expect(unresolved_incident.digest_sent?).to eq false
        assigned_incident = assigns(:incident)
        expect(assigned_incident.errors.messages[:digest_sent_at]).to include "can't be set if digest_worthy is false.", "can't be set if incident is not resolved."
        expect(response).to redirect_to(unresolved_incident)
      end
    end
  end
end
