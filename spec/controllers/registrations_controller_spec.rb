# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegistrationsController, :clean_db_with_truncation do
  context "signed in as organizer" do
    let!(:organizer) { create(:user) }
    let(:competition) { create(:competition, :registration_open, :visible, organizers: [organizer], events: Event.where(id: %w[222 333])) }
    let(:zzyzx_user) { create(:user, name: "Zzyzx") }
    let(:registration) { create(:registration, competition: competition, user: zzyzx_user) }

    before :each do
      sign_in organizer
    end

    it 'allows access to competition organizer' do
      get :index, params: { competition_id: competition }
      expect(response).to have_http_status :ok
    end
  end

  context "register" do
    let(:competition) { create(:competition, :confirmed, :visible, :registration_open) }

    it "redirects to competition root if competition is not using WCA registration" do
      competition.use_wca_registration = false
      competition.save!

      get :register, params: { competition_id: competition.id }
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"
    end

    it "works when not logged in" do
      get :register, params: { competition_id: competition.id }
      expect(assigns(:registration)).to be_nil
    end
  end
end
