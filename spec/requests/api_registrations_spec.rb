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
        expect(response).to have_http_status(:accepted)
      end

      it 'enqueues an AddRegistrationJob' do
        expect {
          post api_v1_registrations_register_path, params: registration_request, headers: headers
        }.to have_enqueued_job(AddRegistrationJob)
      end

      it 'creates a registration when job is worked off' do
        post api_v1_registrations_register_path, params: registration_request, headers: headers
        perform_enqueued_jobs

        registration = Registration.find_by(user_id: user.id)
        expect(registration).to be_present
        expect(registration.events.map(&:id).sort).to eq(['333', '333oh'])
      end

      it 'creates a registration history' do
        post api_v1_registrations_register_path, params: registration_request, headers: headers
        perform_enqueued_jobs

        registration = Registration.find_by(user_id: user.id)
        reg_history = registration.registration_history.first

        expect(reg_history[:actor_id]).to eq(user.id.to_s)
        expect(reg_history[:action]).to eq("Worker processed")
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

        post api_v1_registrations_register_path, params: registration_request, headers: headers
        perform_enqueued_jobs

        expect(response).to have_http_status(:accepted)

        registration = Registration.find_by(user_id: user_with_results.id)
        expect(registration).to be_present
        expect(registration.events.map(&:id).sort).to eq(events)
      end

      it 'cant register when qualifications arent met' do
        registration_request = FactoryBot.build(
          :registration_request, competition_id: comp_with_qualifications.id, user_id: user_without_results.id, events: events
        )

        headers = { 'Authorization' => registration_request['jwt_token'] }

        post api_v1_registrations_register_path, params: registration_request, headers: headers
        perform_enqueued_jobs

        expect(response).to have_http_status(:unprocessable_content)

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

  describe 'PATCH #update' do
    let(:user) { FactoryBot.create :user }
    let(:competition) { FactoryBot.create :competition, :registration_open, :editable_registrations, :with_organizer }
    let(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }

    it 'updates a registration' do
      update_request = FactoryBot.build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition.id,
        competing: { 'status' => 'cancelled' },
        guests: 3,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      expect(response).to have_http_status(:ok)

      registration = Registration.find_by(user_id: user.id)

      expect(registration.guests).to eq(3)
      expect(registration.competing_status).to eq('cancelled')

      history = registration.registration_history
      expect(history.length).to eq(1)
      expect(history.first[:changed_attributes]['guests']).to eq('3')
      expect(history.first[:changed_attributes]['competing_status']).to be_present
      expect(history.first[:action]).to eq('Competitor delete')
    end

    it 'user can change events in a favourites competition' do
      favourites_comp = FactoryBot.create(:competition, :with_event_limit, :editable_registrations, :registration_open)
      favourites_reg = FactoryBot.create(:registration, competition: favourites_comp, user: user, event_ids: %w(333 333oh 555 pyram minx))

      new_event_ids = %w(333 333oh 555 pyram 444)
      update_request = FactoryBot.build(
        :update_request,
        user_id: favourites_reg.user_id,
        competition_id: favourites_reg.competition.id,
        competing: { 'event_ids' => new_event_ids },
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      expect(response).to have_http_status(:ok)

      registration = Registration.find_by(user_id: user.id, competition_id: favourites_reg.competition.id)
      expect(registration.event_ids.sort).to eq(new_event_ids.sort)
    end

    it 'user gets registration email if they cancel and re-register' do
      cancelled_reg = FactoryBot.create(:registration, :cancelled, competition: competition)

      update_request = FactoryBot.build(
        :update_request,
        user_id: cancelled_reg.user_id,
        competition_id: cancelled_reg.competition.id,
        competing: { 'status' => 'pending' },
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers
      perform_enqueued_jobs

      expect(response).to have_http_status(:ok)

      email = ActionMailer::Base.deliveries.last
      expect(email.subject).to eq(I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name))
    end

    it 'user gets registration email if they were rejected and get moved to pending' do
      rejected_reg = FactoryBot.create(:registration, :rejected, competition: competition)

      update_request = FactoryBot.build(
        :update_request,
        user_id: rejected_reg.user_id,
        competition_id: rejected_reg.competition.id,
        submitted_by: competition.organizers.first.id,
        competing: { 'status' => 'pending' },
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers
      perform_enqueued_jobs

      expect(response).to have_http_status(:ok)

      email = ActionMailer::Base.deliveries.last
      expect(email.subject).to eq(I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name))
    end

    it 'raises error if registration doesnt exist' do
      update_request = FactoryBot.build(:update_request, competition_id: competition.id, user_id: user.id)
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:not_found)
    end

    it 'User A cant change User Bs registration' do
      update_request = FactoryBot.build(
        :update_request,
        :for_another_user,
        competition_id: registration.competition.id,
        user_id: registration.user_id,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'user cant update registration if registration edits arent allowed' do
      edits_not_allowed = FactoryBot.create(:competition, :registration_open)
      registration = FactoryBot.create(:registration, competition: edits_not_allowed)

      update_request = FactoryBot.build(
        :update_request,
        competition_id: registration.competition.id,
        user_id: registration.user_id,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change events after comp has started' do
      comp_started = FactoryBot.create(:competition, :ongoing, allow_registration_edits: true)
      registration = FactoryBot.create(:registration, competition: comp_started)

      update_request = FactoryBot.build(
        :update_request,
        competition_id: registration.competition.id,
        user_id: registration.user_id,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change events after event change deadline' do
      edit_deadline_passed = FactoryBot.create(:competition, :event_edit_passed)
      registration = FactoryBot.create(:registration, competition: edit_deadline_passed)

      update_request = FactoryBot.build(
        :update_request,
        competition_id: registration.competition.id,
        user_id: registration.user_id,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant cancel registration after registration ends' do
      editing_over = FactoryBot.create(
        :competition, :registration_closed, :event_edit_passed
      )
      registration = FactoryBot.create(:registration, competition: editing_over)

      update_request = FactoryBot.build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition.id,
        competing: { 'status' => 'cancelled' },
      )

      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change guests after registration change deadline' do
      competition = FactoryBot.create(:competition, :event_edit_passed)
      registration = FactoryBot.create(:registration, competition: competition)

      update_request = FactoryBot.build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition.id,
        guests: 5,
      )

      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change comment after edit events deadline' do
      edit_deadline_passed = FactoryBot.create(:competition, :event_edit_passed)
      registration = FactoryBot.create(:registration, competition: edit_deadline_passed)

      update_request = FactoryBot.build(
        :update_request,
        competition_id: registration.competition.id,
        user_id: registration.user_id,
        competing: { 'comment' => 'updated_comment' },
      )

      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'organizer can change user registration' do
      update_request = FactoryBot.build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition.id,
        submitted_by: competition.organizers.first.id,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers
      expect(response).to have_http_status(:ok)
    end

    it 'organizer can change registration after change deadline' do
      edit_deadline_passed = FactoryBot.create(:competition, :event_edit_passed, :with_organizer)
      registration = FactoryBot.create(:registration, competition: edit_deadline_passed)

      update_request = FactoryBot.build(
        :update_request,
        :organizer_for_user,
        user_id: registration.user_id,
        competition_id: registration.competition.id,
        competing: { 'comment' => 'this is a new comment' },
        submitted_by: edit_deadline_passed.organizers.first.id,
      )
      headers = { 'Authorization' => update_request['jwt_token'] }

      patch api_v1_registrations_register_path, params: update_request, headers: headers
      expect(response).to have_http_status(:ok)
    end

    RSpec.shared_examples 'user cant update rejected registration' do |initial_status, new_status|
      it "user cant change 'status' => #{initial_status} to: #{new_status}" do
        registration = FactoryBot.create(:registration, competing_status: initial_status.to_s, competition: competition)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          competing: { 'status' => new_status },
        )
        headers = { 'Authorization' => update_request['jwt_token'] }

        patch api_v1_registrations_register_path, params: update_request, headers: headers
        error_json = {
          error: Registrations::ErrorCodes::REGISTRATION_IS_REJECTED,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end
    end

    [
      { initial_status: :rejected, new_status: 'cancelled' },
      { initial_status: :rejected, new_status: 'accepted' },
      { initial_status: :rejected, new_status: 'waiting_list' },
      { initial_status: :rejected, new_status: 'pending' },
    ].each do |params|
      it_behaves_like 'user cant update rejected registration', params[:initial_status], params[:new_status]
    end
  end

  describe 'PATCH #bulk_update' do
    let(:competition) { FactoryBot.create :competition, :registration_open, :editable_registrations, :with_competitor_limit, :with_organizer }

    let(:user1) { FactoryBot.create :user }
    let(:user2) { FactoryBot.create :user }
    let(:user3) { FactoryBot.create :user }
    let(:user_ids) { [user1.id, user2.id, user3.id] }

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

      expect(response).to have_http_status(:ok)

      registration = Registration.find_by(user_id: registration1.user_id)

      expect(registration.competing_status).to eq('cancelled')

      history = registration.registration_history
      expect(history.length).to eq(1)
      expect(history.first[:changed_attributes]['competing_status']).to be_present
      expect(history.first[:action]).to eq('Admin delete')
    end

    it 'makes all changes in the given payload' do
      update_request1 = FactoryBot.build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'cancelled' },
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

      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body['updated_registrations'].count).to eq(3)

      expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('cancelled')
      expect(Registration.find_by(user_id: update_request2['user_id']).guests).to eq(3)
      expect(Registration.find_by(user_id: update_request3['user_id']).events.pluck(:id)).to eq(['333', '444'])
    end

    it 'fails if there are validation errors' do
      update_request1 = FactoryBot.build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'cancelled' },
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

      expect(response).to have_http_status(:unprocessable_content)

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

      expect(response).to have_http_status(:bad_request)
    end

    it 'users cant submit bulk updates' do
      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        submitted_by: registration1.user_id,
        user_ids: user_ids,
        competition_id: competition.id,
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers
      error_json = {
        error: [Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS],
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'doesnt raise an error if all checks pass - single update' do
      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
      )
      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response).to have_http_status(:ok)
    end

    it 'doesnt raise an error if all checks pass - 3 updates' do
      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: user_ids,
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
      )
      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      expect(response).to have_http_status(:ok)
    end

    it 'returns an array user_ids:error codes - 1 failure' do
      failed_update = FactoryBot.build(
        :update_request, user_id: registration1.user_id, competition_id: registration1.competition.id, competing: { 'event_ids' => [] }
      )

      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: user_ids,
        submitted_by: default_competition.organizers.first.id,
        competition_id: default_competition.id,
        requests: [failed_update],
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers
      error_json = {
        error: { registration1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION },
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns an array user_ids:error codes - 2 validation failures' do
      failed_update = FactoryBot.build(
        :update_request, user_id: registration1.user_id, competition_id: registration1.competition.id, competing: { 'event_ids' => [] }
      )
      failed_update_2 = FactoryBot.build(
        :update_request, user_id: registration2.user_id, competition_id: registration2.competition.id, competing: { 'status' => 'random_status' }
      )
      normal_update = FactoryBot.build(
        :update_request, user_id: registration3.user_id, competition_id: registration3.competition.id, competing: { 'status' => 'accepted' }
      )

      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: user_ids,
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [failed_update, failed_update_2, normal_update],
      )
      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      error_json = {
        registration1[:user_id] => Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
        registration2[:user_id] => Registrations::ErrorCodes::INVALID_REQUEST_DATA,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns an error if the registration isnt found' do
      missing_registration_user_id = (registration1.user_id-1)
      failed_update = FactoryBot.build(:update_request, user_id: missing_registration_user_id, competition_id: registration1.competition.id)
      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [missing_registration_user_id],
        competition_id: registration1.competition.id,
        requests: [failed_update],
        submitted_by: competition.organizers.first.id,
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      error_json = {
        missing_registration_user_id => Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns errors array - validation failure and reg not found' do
      failed_update = FactoryBot.build(
        :update_request, user_id: registration1.user_id, competition_id: registration1.competition.id, competing: { 'event_ids' => [] }
      )
      normal_update = FactoryBot.build(
        :update_request, user_id: registration3.user_id, competition_id: registration3.competition.id, competing: { 'status' => 'accepted' }
      )

      missing_registration_user_id = 999_999_999
      failed_update2 = FactoryBot.build(
        :update_request, user_id: missing_registration_user_id, competition_id: registration2.competition.id, competing: { 'status' => 'accepted' }
      )
      updates = [failed_update, normal_update, failed_update2]

      bulk_update_request = FactoryBot.build(
        :bulk_update_request,
        user_ids: [registration1.user_id, registration3.user_id, missing_registration_user_id],
        competition_id: registration1.competition.id,
        requests: updates,
        submitted_by: competition.organizers.first.id,
      )

      headers = { 'Authorization' => bulk_update_request['jwt_token'] }
      patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

      error_json = {
        registration1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
        missing_registration_user_id => Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    context 'when bulk accepting registrations' do
      let(:waitlisted1) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
      let(:waitlisted2) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
      let(:waitlisted3) { FactoryBot.create(:registration, :waiting_list, competition: competition) }

      let(:update_request1) {
        FactoryBot.build(
          :update_request,
          user_id: waitlisted1.user_id,
          competition_id: waitlisted1.competition.id,
          competing: { 'status' => 'accepted' },
        )
      }

      let(:update_request2) {
        FactoryBot.build(
          :update_request,
          user_id: waitlisted2.user_id,
          competition_id: waitlisted2.competition.id,
          competing: { 'status' => 'accepted' },
        )
      }

      let(:update_request3) {
        FactoryBot.build(
          :update_request,
          user_id: waitlisted3.user_id,
          competition_id: waitlisted3.competition.id,
          competing: { 'status' => 'accepted' },
        )
      }

      let(:bulk_update_request) {
        FactoryBot.build(
          :bulk_update_request,
          user_ids: [waitlisted1.user_id],
          submitted_by: competition.organizers.first.id,
          competition_id: competition.id,
          requests: [update_request1, update_request2, update_request3],
        )
      }

      let(:headers) { { 'Authorization' => bulk_update_request['jwt_token'] } }

      it 'accepts competitors from the waiting list if there is space in accepted' do
        patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

        expect(response).to have_http_status(:ok)

        expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request2['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request3['user_id']).competing_status).to eq('accepted')
      end

      it 'can accept competitors up to the competitor limit' do
        competition.update(competitor_limit: 3)

        patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers

        expect(response).to have_http_status(:ok)

        expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request2['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request3['user_id']).competing_status).to eq('accepted')
      end

      it 'wont accept competitors over the competitor limit' do
        competition.update(competitor_limit: 2)

        patch api_v1_registrations_bulk_update_path, params: bulk_update_request, headers: headers
        expect(response).to have_http_status(:forbidden)
      end
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

    it 'returns multiple registrations' do
      headers = { 'Authorization' => fetch_jwt_token(competition.organizers.first.id) }
      get api_v1_registrations_list_admin_path(competition_id: competition.id), headers: headers

      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body.count).to eq(6)

      user_ids = [user1.id, user2.id, user3.id, user4.id, user5.id, user6.id]
      body.each do |data|
        expect(user_ids.include?(data['user_id'])).to be(true)
        if data['user_id'] == registration1[:user_id] || data['user_id'] == registration2[:user_id] ||data['user_id'] == registration3[:user_id]
          expect(data.dig('competing', 'registration_status')).to eq('accepted')
          expect(data.dig('competing', 'waiting_list_position')).to be(nil)
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

  describe 'GET #payment_ticket' do
    it 'refuses ticket create request if registration is closed' do
      closed_comp = FactoryBot.create(:competition, :registration_closed, :with_organizer, :stripe_connected)
      reg = FactoryBot.create(:registration, :pending, competition: closed_comp)

      headers = { 'Authorization' => fetch_jwt_token(reg.user_id) }
      get api_v1_registrations_payment_ticket_path(competition_id: closed_comp.id), headers: headers

      body = response.parsed_body
      expect(response).to have_http_status(:forbidden)
      expect(body).to eq({ error: Registrations::ErrorCodes::REGISTRATION_CLOSED }.with_indifferent_access)
    end
  end
end
