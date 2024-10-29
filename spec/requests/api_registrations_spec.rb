# frozen_string_literal: true

require 'rails_helper'

# TODO: Strongly consider refactoring these tests so that there is one expect per it block
RSpec.describe 'API Registrations' do
  include ActiveJob::TestHelper

  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  describe 'POST #create' do
    context 'create a registration' do
      let(:user) { FactoryBot.create :user }
      let(:competition) { FactoryBot.create :competition, :registration_open }
      let(:headers) { { 'Authorization' => registration_request['jwt_token'] } }
      let(:registration_request) { FactoryBot.build(:registration_request, competition_id: competition.id, user_id: user.id) }

      it 'returns 202' do
        # post api_v1_registrations_register_path, params: registration_request, headers: headers
        post api_v1_registrations_register_path, params: registration_request, headers: headers
        expect(response.body).to eq({ status: "accepted", message: "Started Registration Process" }.to_json)
        expect(response.status).to eq(202)
      end

      it 'enqueues an AddRegistrationJob' do
        expect {
          post api_v1_registrations_register_path, params: registration_request, headers: headers
        }.to have_enqueued_job(AddRegistrationJob)
      end
      it 'creates a registration when job is worked off' do
        perform_enqueued_jobs do
          post api_v1_registrations_register_path, params: registration_request, headers: headers
          # post api_v1_registrations_register_path, params: registration_request, headers: headers

          registration = Registration.find_by(user_id: user.id)
          expect(registration).to be_present
          expect(registration.events.map(&:id).sort).to eq(['333', '333oh'])
        end
      end
    end

    context 'register with qualifications' do
      let(:events) { ['222', '333', '444', '555', 'minx', 'pyram'] }
      let(:past_competition) { FactoryBot.create(:competition, :past) }

      let(:comp_with_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_easy_qualifications) }

      let(:user_with_results) { FactoryBot.create(:user, :wca_id) }
      let(:user_without_results) { FactoryBot.create(:user, :wca_id) }

      before do
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '222', best: 400, average: 500)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '333', best: 410, average: 510)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '555', best: 420, average: 520)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '444', best: 430, average: 530)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: 'pyram', best: 440, average: 540)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: 'minx', best: 450, average: 550)
      end

      it 'registers when qualifications are met' do
        registration_request = FactoryBot.build(
          :registration_request, competition_id: comp_with_qualifications.id, user_id: user_with_results.id, events: events
        )
        headers = { 'Authorization' => registration_request['jwt_token'] }

        perform_enqueued_jobs do
          post api_v1_registrations_register_path, params: registration_request, headers: headers

          expect(response.status).to eq(202)

          registration = Registration.find_by(user_id: user_with_results.id)
          expect(registration).to be_present
          expect(registration.events.map(&:id).sort).to eq(events)
        end
      end

      it 'cant register when qualifications arent met' do
        registration_request = FactoryBot.build(
          :registration_request, competition_id: comp_with_qualifications.id, user_id: user_without_results.id, events: events
        )

        headers = { 'Authorization' => registration_request['jwt_token'] }

        perform_enqueued_jobs do
          post api_v1_registrations_register_path, params: registration_request, headers: headers

          expect(response.status).to eq(422)

          error_json = {
            error: Registrations::ErrorCodes::QUALIFICATION_NOT_MET,
            data: events,
          }.to_json

          expect(response.body).to eq(error_json)

          registration = Registration.find_by(user_id: user_without_results.id)
          expect(registration).not_to be_present
        end
      end
    end
  end

  describe 'PATCH #update' do
    let(:user) { FactoryBot.create :user }
    let(:competition) { FactoryBot.create :competition, :registration_open, :editable_registrations }
    let(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }

    it 'updates a registration' do
      update_request = FactoryBot.build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition.id,
        competing: { 'status' => 'deleted' },
        guests: 3,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      expect(response.status).to eq(200)

      registration = Registration.find_by(user_id: user.id)

      expect(registration.guests).to eq(3)
      expect(registration.competing_status).to eq('deleted')

      history = registration.registration_history
      expect(history.length).to eq(1)
      expect(history.first[:changed_attributes]['guests']).to eq('3')
      expect(history.first[:changed_attributes]['deleted_at']).to be_present
      expect(history.first[:action]).to eq('Competitor delete')
    end
  end

  describe 'PATCH #bulk_update' do
    let(:competition) { FactoryBot.create :competition, :registration_open, :editable_registrations, :with_organizer }

    let(:user1) { FactoryBot.create :user }
    let(:user2) { FactoryBot.create :user }
    let(:user3) { FactoryBot.create :user }

    let(:registration1) { FactoryBot.create(:registration, competition: competition, user: user1) }
    let(:registration2) { FactoryBot.create(:registration, competition: competition, user: user2) }
    let(:registration3) { FactoryBot.create(:registration, competition: competition, user: user3) }

    it 'admin submits a bulk update containing 1 update' do
      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response.status).to eq(200)

      registration = Registration.find_by(user_id: user1.id)

      expect(registration.competing_status).to eq('deleted')

      history = registration.registration_history
      expect(history.length).to eq(1)
      expect(history.first[:changed_attributes]['deleted_at']).to be_present
      expect(history.first[:action]).to eq('Admin delete')
    end

    it 'makes all changes in the given payload' do
      update_request1 = FactoryBot.build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'deleted' },
      )

      update_request2 = FactoryBot.build(
        :update_request,
        user_id: registration2.user_id,
        competition_id: registration2.competition.id,
        guests: 3,
      )

      update_request3 = FactoryBot.build(
        :update_request,
        user_id: registration3.user_id,
        competition_id: registration3.competition.id,
        competing: { 'event_ids' => ['333', '444'] },
      )

      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [update_request1, update_request2, update_request3],
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response.status).to eq(200)

      body = JSON.parse(response.body)
      expect(body['updated_registrations'].count).to eq(3)

      expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('deleted')
      expect(Registration.find_by(user_id: update_request2['user_id']).guests).to eq(3)
      expect(Registration.find_by(user_id: update_request3['user_id']).events.pluck(:id)).to eq(['333', '444'])
    end

    it 'fails if there are validation errors' do
      update_request1 = FactoryBot.build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'deleted' },
      )

      update_request2 = FactoryBot.build(
        :update_request,
        user_id: registration2.user_id,
        competition_id: registration2.competition.id,
        guests: 3,
      )

      update_request3 = FactoryBot.build(
        :update_request,
        user_id: registration3.user_id,
        competition_id: registration3.competition.id,
        competing: { 'event_ids' => ['333', '444', 'goofy ah'] },
      )

      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [update_request1, update_request2, update_request3],
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response.status).to eq(422)

      expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('pending')
      expect(Registration.find_by(user_id: update_request2['user_id']).guests).to eq(10)
      expect(Registration.find_by(user_id: update_request3['user_id']).events.pluck(:id)).to eq(['333', '333oh'])
    end

    it 'returns 400 if blank JSON submitted' do
      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: {},
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response.status).to eq(400)
    end

    it 'accepts competitors from the waiting list' do
      waiting_list = FactoryBot.create(:waiting_list, holder: competition)
      waiting_list.add(registration1.user_id)
      waiting_list.add(registration2.user_id)
      waiting_list.add(registration3.user_id)

      update_request1 = FactoryBot.build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'accepted' },
      )

      update_request2 = FactoryBot.build(
        :update_request,
        user_id: registration2.user_id,
        competition_id: registration2.competition.id,
        competing: { 'status' => 'accepted' },
      )

      update_request3 = FactoryBot.build(
        :update_request,
        user_id: registration3.user_id,
        competition_id: registration3.competition.id,
        competing: { 'status' => 'accepted' },
      )

      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [update_request1, update_request2, update_request3],
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response.status).to eq(200)

      expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('accepted')
      expect(Registration.find_by(user_id: update_request2['user_id']).competing_status).to eq('accepted')
      expect(Registration.find_by(user_id: update_request3['user_id']).competing_status).to eq('accepted')
    end
  end

  describe 'GET #list_admin' do
    let(:competition) { FactoryBot.create :competition, :registration_open, :editable_registrations, :with_organizer }

    let(:user1) { FactoryBot.create :user }
    let(:user2) { FactoryBot.create :user }
    let(:user3) { FactoryBot.create :user }
    let(:user4) { FactoryBot.create :user }
    let(:user5) { FactoryBot.create :user }
    let(:user6) { FactoryBot.create :user }

    let!(:registration1) { FactoryBot.create(:registration, :accepted, competition: competition, user: user1) }
    let!(:registration2) { FactoryBot.create(:registration, :accepted, competition: competition, user: user2) }
    let!(:registration3) { FactoryBot.create(:registration, :accepted, competition: competition, user: user3) }
    let!(:registration4) { FactoryBot.create(:registration, :waiting_list, competition: competition, user: user4) }
    let!(:registration5) { FactoryBot.create(:registration, :waiting_list, competition: competition, user: user5) }
    let!(:registration6) { FactoryBot.create(:registration, :waiting_list, competition: competition, user: user6) }

    before do
      FactoryBot.create(:waiting_list, holder: competition)
      competition.waiting_list.add(registration4.user_id)
      competition.waiting_list.add(registration5.user_id)
      competition.waiting_list.add(registration6.user_id)
    end

    it 'returns multiple registrations' do
      headers = { 'Authorization' => fetch_jwt_token(competition.organizers.first.id) }
      get api_v1_registrations_list_admin_path(competition_id: competition.id), headers: headers

      expect(response.status).to eq(200)

      body = JSON.parse(response.body)
      expect(body.count).to eq(6)

      user_ids = [user1.id, user2.id, user3.id, user4.id, user5.id, user6.id]
      body.each do |data|
        expect(user_ids.include?(data['user_id'])).to eq(true)
        if data['user_id'] == registration1[:user_id] || data['user_id'] == registration2[:user_id] ||data['user_id'] == registration3[:user_id]
          expect(data.dig('competing', 'registration_status')).to eq('accepted')
          expect(data.dig('competing', 'waiting_list_position')).to eq(nil)
        elsif data['user_id'] == registration4[:user_id]
          expect(data.dig('competing', 'waiting_list_position')).to eq(1)
        elsif data['user_id'] == registration5[:user_id]
          expect(data.dig('competing', 'waiting_list_position')).to eq(2)
        elsif data['user_id'] == registration6[:user_id]
          expect(data.dig('competing', 'waiting_list_position')).to eq(3)
        end
      end
    end
  end
end
