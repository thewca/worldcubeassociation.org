# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AdminController, type: :controller do
  describe 'merge_people' do
    sign_in { FactoryBot.create :admin }

    let(:person1) { FactoryBot.create(:person) }
    let(:person2) { FactoryBot.create(:person, person1.attributes.symbolize_keys!.slice(:name, :country_id, :gender, :dob)) }

    it 'can merge people' do
      post :do_merge_people, params: { merge_people: { person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id } }
      expect(response).to have_http_status :ok
      expect(response).to render_template :merge_people
      expect(flash.now[:success]).to eq "Successfully merged #{person2.wca_id} into #{person1.wca_id}!"
    end
  end

  describe 'reassign_wca_id' do
    sign_in { FactoryBot.create :admin }

    let(:user1) { FactoryBot.create(:user_with_wca_id) }
    let(:user2) { FactoryBot.create(:user, user1.attributes.symbolize_keys!.slice(:name, :country_iso2, :gender, :dob)) }

    it 'can validate reassign wca id' do
      get :validate_reassign_wca_id, params: { reassign_wca_id: { account1: user1, account2: user2 } }
      expect(response).to have_http_status :ok
      expect(response).to render_template :reassign_wca_id
    end

    it 'can reassign wca id' do
      post :do_reassign_wca_id, params: { reassign_wca_id: { account1: user1, account2: user2 } }
      expect(response).to have_http_status :ok
      expect(response).to render_template :reassign_wca_id
      expect(flash.now[:success]).to eq "Successfully reassigned #{user1.wca_id} from account #{user1.id} to #{user2.id}!"
    end
  end
end
