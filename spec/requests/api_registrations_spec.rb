# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API Registrations' do
  include ActiveJob::TestHelper

  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  describe 'POST #create' do
    context 'create a registration' do
      let(:user) { FactoryBot.create :user }
      let(:competition) { FactoryBot.create :competition, :registration_open}
      let(:registration_request) { FactoryBot.build(:registration_request, competition_id: competition.id, user_id: user.id) }
      let(:headers) { { 'Authorization' => registration_request['jwt_token'] } }

      it 'returns 202' do
        post api_v1_registrations_create_registration_path, params: registration_request, headers: headers
        expect(response.body).to eq({status:"accepted",message:"Started Registration Process"}.to_json)
        expect(response.status).to eq(202)
      end

      it 'enqueues an AddRegistrationJob' do
        expect {
          post api_v1_registrations_create_registration_path, params: registration_request, headers: headers
        }.to have_enqueued_job(AddRegistrationJob)
      end

      it 'creates a registration when job is worked off' do
        perform_enqueued_jobs do
          post api_v1_registrations_create_registration_path, params: registration_request, headers: headers

          registration = Registration.find_by(user_id: user.id)
          expect(registration).to be_present
          expect(registration.events.map(&:id).sort).to eq(['333', '333oh'])
        end
      end
    end
  end
end
