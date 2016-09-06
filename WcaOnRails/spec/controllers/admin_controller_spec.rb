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
      sign_in { FactoryGirl.create :delegate }

      it 'redirects to the root page' do
        get :index
        expect(response).to redirect_to root_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'shows the index page' do
        get :index
        expect(response).to render_template :index
      end
    end
  end

  describe 'merge_people' do
    sign_in { FactoryGirl.create :admin }

    let(:person1) { FactoryGirl.create(:person) }
    let(:person2) { FactoryGirl.create(:person, person1.attributes.symbolize_keys!.slice(:name, :countryId, :gender, :year, :month, :day)) }

    it 'can merge people' do
      post :do_merge_people, merge_people: { person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id }
      expect(response.status).to eq 200
      expect(response).to render_template :merge_people
      expect(flash.now[:success]).to eq "Successfully merged #{person2.wca_id} into #{person1.wca_id}!"
    end
  end

  describe 'PATCH #update person' do
    sign_in { FactoryGirl.create :admin }

    let(:person) { FactoryGirl.create(:person_who_has_competed_once, name: "Feliks Zemdegs", countryId: "Australia") }

    it "shows a message with link to the check_regional_record_markers script if the person has been fixed and countryId has changed" do
      patch :update_person, method: "fix", person: { wca_id: person.wca_id, countryId: "New Zealand" }
      expect(flash[:warning]).to include "check_regional_record_markers"
      expect(response).to render_template :edit_person
    end

    it "shows a successful message when the person has been changed" do
      patch :update_person, method: "fix", person: { wca_id: person.wca_id, name: "New Name" }
      expect(response.status).to eq 200
      expect(response).to render_template :edit_person
      expect(flash[:success]).to eq "Successfully fixed New Name."
    end
  end
end
