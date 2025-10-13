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
end
