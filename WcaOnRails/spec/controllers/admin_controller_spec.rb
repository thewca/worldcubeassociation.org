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
    let(:person2) { FactoryBot.create(:person, person1.attributes.symbolize_keys!.slice(:name, :countryId, :gender, :dob)) }

    it 'can merge people' do
      post :do_merge_people, params: { merge_people: { person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id } }
      expect(response.status).to eq 200
      expect(response).to render_template :merge_people
      expect(flash.now[:success]).to eq "Successfully merged #{person2.wca_id} into #{person1.wca_id}!"
    end
  end

  describe 'anonymize_person' do
    sign_in { FactoryBot.create :admin }

    let(:person) { FactoryBot.create(:person_who_has_competed_once) }

    it 'can anonymize person' do
      get :anonymize_person
      post :do_anonymize_person, params: { anonymize_person: { person_wca_id: person.wca_id } }
      expect(response.status).to eq 200
      expect(response).to render_template :anonymize_person

      post :do_anonymize_person, params: { anonymize_person: { person_wca_id: person.wca_id } }
      expect(response.status).to eq 200
      expect(response).to render_template :anonymize_person
      expect(flash.now[:success]).to eq "Successfully anonymized #{person.wca_id} to #{person.wca_id[0..3]}ANON01! Don't forget to run Compute Auxiliary Data and Export Public."
    end
  end

  describe 'reassign_wca_id' do
    sign_in { FactoryBot.create :admin }

    let(:user1) { FactoryBot.create(:user_with_wca_id) }
    let(:user2) { FactoryBot.create(:user, user1.attributes.symbolize_keys!.slice(:name, :country_iso2, :gender, :dob)) }

    it 'can validate reassign wca id' do
      get :validate_reassign_wca_id, params: { reassign_wca_id: { account1: user1, account2: user2 } }
      expect(response.status).to eq 200
      expect(response).to render_template :reassign_wca_id
    end

    it 'can reassign wca id' do
      post :do_reassign_wca_id, params: { reassign_wca_id: { account1: user1, account2: user2 } }
      expect(response.status).to eq 200
      expect(response).to render_template :reassign_wca_id
      expect(flash.now[:success]).to eq "Successfully reassigned #{user1.wca_id} from account #{user1.id} to #{user2.id}!"
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
