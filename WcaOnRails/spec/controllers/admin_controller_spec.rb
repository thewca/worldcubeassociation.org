# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AdminController, type: :controller do
  describe 'GET #index' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        get :index
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a delegate' do
      sign_in { FactoryBot.create :delegate }

      it 'redirects to the root page' do
        get :index
        expect(response).to redirect_to root_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryBot.create :admin }

      it 'shows the index page' do
        get :index
        expect(response).to render_template :index
      end
    end
  end

  describe 'merge_people' do
    sign_in { FactoryBot.create :admin }

    let(:person1) { FactoryBot.create(:person) }
    let(:person2) { FactoryBot.create(:person, person1.attributes.symbolize_keys!.slice(:name, :countryId, :gender, :year, :month, :day)) }

    it 'can merge people' do
      post :do_merge_people, params: { merge_people: { person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id } }
      expect(response.status).to eq 200
      expect(response).to render_template :merge_people
      expect(flash.now[:success]).to eq "Successfully merged #{person2.wca_id} into #{person1.wca_id}!"
    end
  end

  describe 'add_new_result' do
    sign_in { FactoryBot.create :admin }

    let(:person) { FactoryBot.create(:person) }
    let(:competition) { FactoryBot.create(:competition, :with_results) }
    let(:round) { FactoryBot.create(:round, competition: competition, event_id: "333") }

    it 'can add new result' do
      post :do_add_new_result, params: { 
        add_new_result: {
          is_new_competitor: "0",
          competitor_id: person.wca_id,
          competition_id: competition.id,
          event_id: "333",
          round_id: round.id,
          value1: "1200",
          value2: "1400",
          value3: "1400",
          value4: "1400",
          value5: "1400"
        } 
      }
      
      expect(response.status).to eq 200
      expect(response).to render_template :add_new_result
      expect(flash.now[:success]).to eq "Successfully added new result for <a href=\"/persons/#{person.wca_id}\">#{person.wca_id}</a>! \n        Please make sure to: \n        1. <a href=\"/results/admin/check_regional_record_markers.php?competitionId=#{competition.id}&amp;show=Show\">Check Records</a>. \n        2. <a href=\"/competitions/#{competition.id}/admin/check-existing-results\">Check Competition Validators</a>.\n        3. <a href=\"/admin/compute_auxiliary_data\">Run Compute Auxillery Data</a>.\n        \n        "
    end
  end

  describe 'competition_data' do
    sign_in { FactoryBot.create :admin }

    let(:competition) { FactoryBot.create(:competition) }

    it 'can get competition data' do
      get :competition_data, params: { competition_id: competition.id }
      expect(response.status).to eq 200
      expect(JSON.parse(response.body)["name"]).to eq competition.name
    end
  end

  describe 'PATCH #update person' do
    sign_in { FactoryBot.create :admin }

    let(:person) { FactoryBot.create(:person_who_has_competed_once, name: "Feliks Zemdegs", countryId: "Australia") }

    it "shows a message with link to the check_regional_record_markers script if the person has been fixed and countryId has changed" do
      patch :update_person, params: { method: "fix", person: { wca_id: person.wca_id, countryId: "New Zealand" } }
      expect(flash[:warning]).to include "check_regional_record_markers"
      expect(response).to render_template :edit_person
    end

    it "shows a successful message when the person has been changed" do
      patch :update_person, params: { method: "fix", person: { wca_id: person.wca_id, name: "New Name" } }
      expect(response.status).to eq 200
      expect(response).to render_template :edit_person
      expect(flash[:success]).to eq "Successfully fixed New Name."
    end
  end
end
