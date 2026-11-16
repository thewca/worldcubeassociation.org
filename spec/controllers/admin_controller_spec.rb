# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AdminController do
  describe 'merge_people' do
    before { sign_in create :admin }

    let(:person1) { create(:person) }
    let(:person2) { create(:person, person1.attributes.symbolize_keys!.slice(:name, :country_id, :gender, :dob)) }

    it 'can merge people' do
      post :do_merge_people, params: { merge_people: { person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id } }
      expect(response).to have_http_status :ok
      expect(response).to render_template :merge_people
      expect(flash.now[:success]).to eq "Successfully merged #{person2.wca_id} into #{person1.wca_id}!"
    end
  end

  describe 'migration_dashboard' do
    render_views

    let(:competition) { create(:competition, :ongoing, scoretaking_software: :internal, event_ids: ["333"]) }
    let(:round) { create(:round, competition: competition, event_id: "333") }

    before do
      create(:live_result, round: round, registration: create(:registration, :accepted, competition: competition))
    end

    it 'shows ILR competitions of this week to admins' do
      sign_in create(:admin)

      get :migration_dashboard
      expect(response).to have_http_status :ok
      expect(assigns(:ilr_competitions_count)).to eq 1
      expect(assigns(:live_attempts_by_competition)).to eq(competition.id => 5)
      expect(response.body).to include competition.name
    end

    it 'does not count live results synced from WCA Live' do
      wca_live_competition = create(:competition, :ongoing, scoretaking_software: :wca_live, event_ids: ["333"])
      wca_live_round = create(:round, competition: wca_live_competition, event_id: "333")
      create(:live_result, round: wca_live_round, registration: create(:registration, :accepted, competition: wca_live_competition))
      sign_in create(:admin)

      get :migration_dashboard
      expect(assigns(:ilr_competitions_count)).to eq 1
      expect(assigns(:live_attempts_count)).to eq 5
      expect(response.body).not_to include wca_live_competition.name
    end

    it 'marks ILR competitions with dual rounds' do
      dual_round_competition = create(:competition, :ongoing, scoretaking_software: :internal, event_ids: ["333"])
      create(:round, competition: dual_round_competition, event_id: "333", linked_round: create(:linked_round))
      sign_in create(:admin)

      get :migration_dashboard
      expect(assigns(:ilr_competitions_count)).to eq 2
      expect(assigns(:ilr_competitions_without_dual_rounds_count)).to eq 1
      expect(assigns(:dual_round_competition_ids_this_week)).to eq [dual_round_competition.id]
      expect(response.body).to include "Dual rounds"
    end

    it 'redirects non-admins' do
      sign_in create(:user)

      get :migration_dashboard
      expect(response).to redirect_to root_url
    end
  end
end
