# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionTabsController, type: :controller do
  let!(:organizer) { FactoryBot.create :user }
  let(:competition) { FactoryBot.create :competition, organizers: [organizer] }

  context "when signed in as organizer" do
    before do
      sign_in organizer
    end

    it "can view the tabs index for his competition" do
      get :index, params: { competition_id: competition.id }
      expect(response.status).to eq 200
      expect(response).to render_template :index
    end

    it "can create a new tab" do
      expect do
        get :create, params: {
          competition_id: competition.id,
          competition_tab: { name: "Accommodation", content: "On your own." },
        }
      end.to change { competition.tabs.count }.by(1)
      tab = competition.tabs.last
      expect(tab.name).to eq "Accommodation"
      expect(tab.content).to eq "On your own."
    end

    it "can update an existing tab" do
      tab = FactoryBot.create(:competition_tab, competition: competition)
      patch :update, params: {
        competition_id: competition.id,
        id: tab.id,
        competition_tab: { name: "Accommodation", content: "On your own." },
      }
      tab.reload
      expect(tab.name).to eq "Accommodation"
    end

    it "can destroy an existing tab" do
      tab = FactoryBot.create(:competition_tab, competition: competition)
      expect do
        delete :destroy, params: { competition_id: competition.id, id: tab.id }
      end.to change { competition.tabs.count }.by(-1)
    end
  end
end
