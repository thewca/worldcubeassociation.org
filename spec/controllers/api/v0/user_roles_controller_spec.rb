# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::UserRolesController do
  describe 'GET #list' do
    let!(:user_senior_delegate_role) { FactoryBot.create(:senior_delegate_role) }
    let!(:user_whose_delegate_status_changes) { FactoryBot.create(:candidate_delegate, region_id: user_senior_delegate_role.group.id, location: 'Australia') }
    let!(:delegate) { FactoryBot.create :delegate, region_id: user_senior_delegate_role.group.id }
    let!(:person) { FactoryBot.create :person, dob: '1990-01-02' }
    let!(:user_who_claims_wca_id) do
      FactoryBot.create(
        :user,
        unconfirmed_wca_id: person.wca_id,
        delegate_id_to_handle_wca_id_claim: user_whose_delegate_status_changes.id,
        claiming_wca_id: true,
        dob_verification: "1990-01-2",
      )
    end

    context 'when user is logged in and changing role data' do
      before do
        allow(controller).to receive(:current_user) { user_senior_delegate_role.user }
      end

      it 'fetches list of roles of a user' do
        get :index_for_user, params: { user_id: user_whose_delegate_status_changes.id }

        expect(response.body).to eq(user_whose_delegate_status_changes.active_roles.to_json)
      end
    end
  end
end
