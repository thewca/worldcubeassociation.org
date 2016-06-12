require 'rails_helper'

RSpec.describe CompetitionTabsController, type: :controller do
  let(:organizer) { FactoryGirl.create :user }
  let(:competition) { FactoryGirl.create :competition, organizers: [organizer] }

  context "when signed in as organizer" do
    before do
      sign_in organizer
    end

    it "can view the tabs index for his competition" do
      get :index, competition_id: competition.id
      expect(response.status).to eq 200
      expect(response).to render_template :index
    end

    it "can create a new tab" do
      expect do
        get :create, competition_id: competition.id,
                     competition_tab: { name: "Accommodation", content: "On your own." }
      end.to change { competition.competition_tabs.count }.by(1)
      tab = competition.competition_tabs.last
      expect(tab.name).to eq "Accommodation"
      expect(tab.content).to eq "On your own."
    end

    it "can edit an existing tab" do
      tab = FactoryGirl.create(:competition_tab, competition: competition)
      get :update, competition_id: competition.id, id: tab.id,
                   competition_tab: { name: "Accommodation", content: "On your own." }
      tab.reload
      expect(tab.name).to eq "Accommodation"
    end
  end
end
