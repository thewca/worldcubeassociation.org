# frozen_string_literal: true

require 'rails_helper'

# TODO: Strongly consider refactoring these tests so that there is one expect per it block
RSpec.describe 'API Registrations' do
  include ActiveJob::TestHelper

  describe 'POST #create' do
    context 'when creating a registration' do
      let(:user) { create(:user) }
      let(:competition) { create(:competition, :registration_open) }
      let(:registration_request) { build(:registration_request, competition_id: competition.id, user_id: user.id) }

      it 'returns 202' do
        api_sign_in_as(user)
        post api_v1_competition_registrations_path(competition), params: registration_request
        expect(response.body).to eq({ status: "accepted", message: "Started Registration Process" }.to_json)
        expect(response).to have_http_status(:accepted)
      end

      it 'enqueues an AddRegistrationJob' do
        expect do
          api_sign_in_as(user)
          post api_v1_competition_registrations_path(competition), params: registration_request
        end.to have_enqueued_job(AddRegistrationJob)
      end

      it 'creates a registration when job is worked off' do
        api_sign_in_as(user)
        post api_v1_competition_registrations_path(competition), params: registration_request
        perform_enqueued_jobs

        registration = Registration.find_by(user_id: user.id)
        expect(registration).to be_present
        expect(registration.events.map(&:id).sort).to eq(%w[333 333oh])
      end

      it 'creates a registration history' do
        api_sign_in_as(user)
        post api_v1_competition_registrations_path(competition), params: registration_request
        perform_enqueued_jobs

        registration = Registration.find_by(user_id: user.id)
        reg_history = registration.registration_history.first

        expect(reg_history[:actor_id]).to eq(user.id.to_s)
        expect(reg_history[:action]).to eq("Worker processed")
      end

      it 'cant register if registration is closed' do
        competition = create(:competition, :registration_closed)
        registration_request = build(:registration_request, competition_id: competition.id, user_id: user.id)
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::REGISTRATION_CLOSED,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:forbidden)
      end

      it 'user cant create a duplicate registration' do
        existing_reg = create(:registration, competition: competition)

        registration_request = build(
          :registration_request, guests: 10, competition_id: competition.id, user_id: existing_reg.user_id
        )
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::REGISTRATION_ALREADY_EXISTS,
        }.to_json
        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:forbidden)
      end

      it 'doesnt leak data if organizer tries to register for a banned user' do
        banned_user = create(:user, :banned)
        competition = create(:competition, :registration_open, :with_organizer)
        organizer_id = competition.organizers.first.id
        registration_request = build(
          :registration_request, :incomplete, :impersonation, competition_id: competition.id, user_id: banned_user.id, submitted_by: organizer_id
        )
        api_sign_in_as(competition.organizers.first)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'doesnt leak data if user tries to register for a banned user' do
        banned_user = create(:user, :banned)
        registration_request = build(
          :registration_request, :banned, :impersonation, competition_id: competition.id, user_id: banned_user.id, submitted_by: user.id
        )
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'user with incomplete profile cant register' do
        user = create(:user, :incomplete)
        registration_request = build(:registration_request, :incomplete, competition_id: competition.id, user_id: user.id)
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::USER_CANNOT_COMPETE,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'cant register if ban ends after competition starts' do
        banned_user = create(:user, :banned)
        registration_request = build(:registration_request, competition_id: competition.id, user_id: banned_user.id)
        api_sign_in_as(banned_user)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::USER_CANNOT_COMPETE,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'can register if ban ends before competition starts' do
        briefly_banned_user = create(:user, :briefly_banned)
        registration_request = build(:registration_request, competition_id: competition.id, user_id: briefly_banned_user.id)
        api_sign_in_as(briefly_banned_user)

        post api_v1_competition_registrations_path(competition), params: registration_request

        expect(response).to have_http_status(:accepted)
      end

      it 'organizers cannot create registrations for users' do
        competition = create(:competition, :registration_open, :with_organizer)
        registration_request = build(
          :registration_request,
          competition_id: competition.id,
          user_id: user.id,
          submitted_by: competition.organizers.first.id,
        )
        api_sign_in_as(competition.organizers.first)

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'organizers can register before registration opens' do
        competition = create(:competition, :registration_not_opened, :with_organizer)
        registration_request = build(:registration_request, competition_id: competition.id, user_id: competition.organizers.first.id)
        api_sign_in_as(competition.organizers.first)

        post api_v1_competition_registrations_path(competition), params: registration_request
        expect(response.body).to eq({ status: "accepted", message: "Started Registration Process" }.to_json)
        expect(response).to have_http_status(:accepted)
      end

      it 'users can only register for themselves' do
        registration_request = build(:registration_request, :impersonation, competition_id: competition.id, user_id: user.id)
        api_sign_in_as(create(:user))

        post api_v1_competition_registrations_path(competition), params: registration_request

        error_json = {
          error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'can register if this is the first registration in a series' do
        series = create(:competition_series)
        competition_a = create(:competition, :registration_open, competition_series: series)
        create(:competition, :registration_open, competition_series: series, series_base: competition_a)

        registration_request = build(:registration_request, competition_id: competition_a.id, user_id: user.id)
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition_a), params: registration_request

        expect(response).to have_http_status(:accepted)
      end

      it 'can register if already have a non-cancelled registration for another series competition' do
        registration = create(:registration, :accepted)

        series = create(:competition_series)
        competition_a = registration.competition
        competition_a.update!(competition_series: series)
        competition_b = create(:competition, :registration_open, competition_series: series, series_base: competition_a)

        user = registration.user

        registration_request = build(:registration_request, competition_id: competition_b.id, user_id: user.id)
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition_b), params: registration_request

        expect(response).to have_http_status(:accepted)
      end

      it 'can register if they have a cancelled registration for another series comp' do
        registration = create(:registration, :cancelled)

        series = create(:competition_series)
        competition_a = registration.competition
        competition_a.update!(competition_series: series)
        competition_b = create(:competition, :registration_open, competition_series: series, series_base: competition_a)

        user = registration.user

        registration_request = build(:registration_request, competition_id: competition_b.id, user_id: user.id)
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition_b), params: registration_request

        expect(response).to have_http_status(:accepted)
      end

      it 'can register if they have a pending registration for another series comp' do
        registration = create(:registration, :pending)

        series = create(:competition_series)
        competition_a = registration.competition
        competition_a.update!(competition_series: series)
        competition_b = create(:competition, :registration_open, competition_series: series, series_base: competition_a)

        user = registration.user

        registration_request = build(:registration_request, competition_id: competition_b.id, user_id: user.id)
        api_sign_in_as(user)

        post api_v1_competition_registrations_path(competition_b), params: registration_request

        expect(response).to have_http_status(:accepted)
      end
    end

    context 'register with qualifications' do
      let(:events) { %w[222 333 444 555 minx pyram] }
      let(:past_competition) { create(:competition, :past) }

      let(:comp_with_qualifications) { create(:competition, :registration_open, :enforces_easy_qualifications) }

      let(:user_with_results) { create(:user, :wca_id) }
      let(:user_without_results) { create(:user, :wca_id) }

      before do
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '222', best: 400, average: 500)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '333', best: 410, average: 510)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '555', best: 420, average: 520)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '444', best: 430, average: 530)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: 'pyram', best: 440, average: 540)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: 'minx', best: 450, average: 550)
      end

      it 'registers when qualifications are met' do
        registration_request = build(
          :registration_request, competition_id: comp_with_qualifications.id, user_id: user_with_results.id, events: events
        )
        api_sign_in_as(user_with_results)

        post api_v1_competition_registrations_path(comp_with_qualifications), params: registration_request
        perform_enqueued_jobs

        expect(response).to have_http_status(:accepted)

        registration = Registration.find_by(user_id: user_with_results.id)
        expect(registration).to be_present
        expect(registration.events.map(&:id).sort).to eq(events)
      end

      it 'cant register when qualifications arent met' do
        registration_request = build(
          :registration_request, competition_id: comp_with_qualifications.id, user_id: user_without_results.id, events: events
        )

        api_sign_in_as(user_without_results)

        post api_v1_competition_registrations_path(comp_with_qualifications), params: registration_request
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
    let(:user) { create(:user) }
    let(:competition) { create(:competition, :registration_open, :editable_registrations, :with_organizer) }
    let(:registration) { create(:registration, competition: competition, user: user) }
    let(:paid_cant_cancel) do
      create(
        :competition, :registration_closed, :editable_registrations, :with_organizer, competitor_can_cancel: :unpaid
      )
    end
    let(:accepted_cant_cancel) do
      create(
        :competition, :registration_closed, :editable_registrations, :with_organizer, competitor_can_cancel: :not_accepted
      )
    end

    it 'updates a registration' do
      update_request = build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        competing: { 'status' => 'cancelled' },
        guests: 3,
      )
      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      expect(response).to have_http_status(:ok)

      response_v2_reg = response.parsed_body[:registration]
      expect(response_v2_reg[:guests]).to eq(3)
      expect(response_v2_reg[:competing][:registration_status]).to eq('cancelled')

      registration = Registration.find_by(user_id: user.id, competition_id: competition.id)

      expect(registration.guests).to eq(3)
      expect(registration.competing_status).to eq('cancelled')

      history = registration.registration_history
      expect(history.length).to eq(1)
      expect(history.first[:changed_attributes][:guests]).to eq('3')
      expect(history.first[:changed_attributes][:competing_status]).to be_present
      expect(history.first[:action]).to eq('Competitor delete')
    end

    it 'user can change events in a favourites competition' do
      favourites_comp = create(:competition, :with_event_limit, :editable_registrations, :registration_open)
      favourites_reg = create(:registration, competition: favourites_comp, user: user, event_ids: %w[333 333oh 555 pyram minx])

      new_event_ids = %w[333 333oh 555 pyram 444]
      update_request = build(
        :update_request,
        user_id: favourites_reg.user_id,
        competition_id: favourites_reg.competition.id,
        competing: { 'event_ids' => new_event_ids },
      )
      api_sign_in_as(favourites_reg.user)

      patch api_v1_registration_path(favourites_reg), params: update_request

      expect(response).to have_http_status(:ok)

      response_v2_reg = response.parsed_body[:registration]
      expect(response_v2_reg[:competing][:event_ids].sort).to eq(new_event_ids.sort)

      registration = Registration.find_by(user_id: user.id, competition_id: favourites_reg.competition.id)
      expect(registration.event_ids.sort).to eq(new_event_ids.sort)
    end

    it 'user gets registration email if they cancel and re-register' do
      cancelled_reg = create(:registration, :cancelled, competition: competition)

      update_request = build(
        :update_request,
        user_id: cancelled_reg.user_id,
        competition_id: cancelled_reg.competition.id,
        competing: { 'status' => 'pending' },
      )
      api_sign_in_as(cancelled_reg.user)

      patch api_v1_registration_path(cancelled_reg), params: update_request
      perform_enqueued_jobs

      expect(response).to have_http_status(:ok)

      email = ActionMailer::Base.deliveries.last
      expect(email.subject).to eq(I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name))
    end

    it 'user gets registration email if they were rejected and get moved to pending' do
      rejected_reg = create(:registration, :rejected, competition: competition)

      update_request = build(
        :update_request,
        user_id: rejected_reg.user_id,
        competition_id: rejected_reg.competition.id,
        submitted_by: competition.organizers.first.id,
        competing: { 'status' => 'pending' },
      )
      api_sign_in_as(competition.organizers.first)

      patch api_v1_registration_path(rejected_reg), params: update_request
      perform_enqueued_jobs

      expect(response).to have_http_status(:ok)

      email = ActionMailer::Base.deliveries.last
      expect(email.subject).to eq(I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name))
    end

    it 'raises error if registration doesnt exist' do
      update_request = build(:update_request, competition_id: competition.id, user_id: user.id)
      api_sign_in_as(user)

      # Assuming that we're never generating one-thousand three-hundred persisted registrations during tests…
      patch api_v1_registration_path(1337), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:not_found)
    end

    it 'User A cant change User Bs registration' do
      update_request = build(
        :update_request,
        :for_another_user,
        competition_id: registration.competition.id,
        user_id: registration.user_id,
      )
      api_sign_in_as(create(:user))

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'user cant update registration if registration edits arent allowed' do
      edits_not_allowed = create(:competition, :registration_open)
      registration = create(:registration, competition: edits_not_allowed)

      update_request = build(
        :update_request,
        competition_id: registration.competition_id,
        user_id: registration.user_id,
      )
      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change events after comp has started' do
      comp_started = create(:competition, :ongoing, allow_registration_edits: true)
      registration = create(:registration, competition: comp_started)

      update_request = build(
        :update_request,
        competition_id: registration.competition_id,
        user_id: registration.user_id,
      )
      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change events after event change deadline' do
      edit_deadline_passed = create(:competition, :event_edit_passed)
      registration = create(:registration, competition: edit_deadline_passed)

      update_request = build(
        :update_request,
        competition_id: registration.competition_id,
        user_id: registration.user_id,
      )
      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant cancel registration after registration ends' do
      editing_over = create(
        :competition, :registration_closed, :event_edit_passed
      )
      registration = create(:registration, competition: editing_over)

      update_request = build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        competing: { 'status' => 'cancelled' },
      )

      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change guests after registration change deadline' do
      competition = create(:competition, :event_edit_passed)
      registration = create(:registration, competition: competition)

      update_request = build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        guests: 5,
      )

      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant change comment after edit events deadline' do
      edit_deadline_passed = create(:competition, :event_edit_passed)
      registration = create(:registration, competition: edit_deadline_passed)

      update_request = build(
        :update_request,
        competition_id: registration.competition_id,
        user_id: registration.user_id,
        competing: { 'comment' => 'updated_comment' },
      )

      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'user cant submit an admin comment' do
      update_request = build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        competing: { 'admin_comment' => 'this is an admin comment' },
      )

      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'user cant submit waiting_list_position' do
      update_request = build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        competing: { 'waiting_list_position' => '1' },
      )

      api_sign_in_as(registration.user)

      patch api_v1_registration_path(registration), params: update_request

      error_json = {
        error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'organizer can change user registration' do
      update_request = build(
        :update_request,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        submitted_by: competition.organizers.first.id,
        competing: { 'comment' => 'updated_comment' },
      )
      api_sign_in_as(competition.organizers.first)

      patch api_v1_registration_path(registration), params: update_request
      expect(response).to have_http_status(:ok)
    end

    it 'organizer can change registration after change deadline' do
      edit_deadline_passed = create(:competition, :event_edit_passed, :with_organizer)
      registration = create(:registration, competition: edit_deadline_passed)

      update_request = build(
        :update_request,
        :organizer_for_user,
        user_id: registration.user_id,
        competition_id: registration.competition_id,
        competing: { 'comment' => 'this is a new comment' },
        submitted_by: edit_deadline_passed.organizers.first.id,
      )
      api_sign_in_as(edit_deadline_passed.organizers.first)

      patch api_v1_registration_path(registration), params: update_request
      expect(response).to have_http_status(:ok)
    end

    it 'cant re-register (register after cancelling) if they have a registration for another series comp' do
      registration_a = create(:registration, :accepted)
      series = create(:competition_series)
      competition_a = registration_a.competition
      competition_b = create(
        :competition, :registration_open, :editable_registrations, :with_organizer, competition_series: series, series_base: competition_a
      )
      registration_b = create(:registration, :cancelled, competition: competition_b, user_id: registration_a.user.id)
      competition_a.update!(competition_series: series)

      update_request = build(
        :update_request,
        user_id: registration_b.user.id,
        competition_id: competition_b.id,
        competing: { 'status' => 'pending' },
      )
      api_sign_in_as(registration_b.user)

      patch api_v1_registration_path(registration_b), params: update_request
      error_json = {
        error: Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'cancelled user cant re-register if registration is closed' do
      closed_comp = create(:competition, :registration_closed, :editable_registrations)
      cancelled_reg = create(:registration, :cancelled, competition: closed_comp)

      update_request = build(
        :update_request,
        user_id: cancelled_reg.user_id,
        competition_id: cancelled_reg.competition_id,
        competing: { 'status' => 'pending' },
      )

      api_sign_in_as(cancelled_reg.user)

      patch api_v1_registration_path(cancelled_reg), params: update_request
      error_json = {
        error: Registrations::ErrorCodes::REGISTRATION_CLOSED,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:forbidden)
    end

    it 'stops user cancelling fully paid registration' do
      paid_reg = create(:registration, :paid, competition: paid_cant_cancel)

      update_request = build(
        :update_request,
        user_id: paid_reg.user_id,
        competition_id: paid_reg.competition_id,
        competing: { 'status' => 'cancelled' },
      )

      api_sign_in_as(paid_reg.user)

      patch api_v1_registration_path(paid_reg), params: update_request
      error_json = {
        error: Registrations::ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'stops user cancelling partially paid registration' do
      paid_reg = create(:registration, :partially_paid, competition: paid_cant_cancel)

      update_request = build(
        :update_request,
        user_id: paid_reg.user_id,
        competition_id: paid_reg.competition_id,
        competing: { 'status' => 'cancelled' },
      )
      api_sign_in_as(paid_reg.user)

      patch api_v1_registration_path(paid_reg), params: update_request
      error_json = {
        error: Registrations::ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'stops accepted user from cancelling' do
      accepted_reg = create(:registration, :accepted, competition: accepted_cant_cancel)

      update_request = build(
        :update_request,
        user_id: accepted_reg.user_id,
        competition_id: accepted_reg.competition_id,
        competing: { 'status' => 'cancelled' },
      )
      api_sign_in_as(accepted_reg.user)

      patch api_v1_registration_path(accepted_reg), params: update_request
      error_json = {
        error: Registrations::ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION,
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    RSpec.shared_examples 'invalid user status updates' do |initial_status, new_status|
      it "user cant change 'status' => #{initial_status} to: #{new_status}" do
        registration = create(:registration, initial_status, competition: competition)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          competing: { 'status' => new_status },
        )
        api_sign_in_as(registration.user)

        patch api_v1_registration_path(registration), params: update_request
        error_json = {
          error: Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS,
        }.to_json

        expect(response.body).to eq(error_json)
        expect(response).to have_http_status(:unauthorized)
      end
    end

    [
      { initial_status: :pending, new_status: 'accepted' },
      { initial_status: :pending, new_status: 'waiting_list' },
      { initial_status: :pending, new_status: 'pending' },
      { initial_status: :pending, new_status: 'rejected' },
      { initial_status: :waiting_list, new_status: 'pending' },
      { initial_status: :waiting_list, new_status: 'waiting_list' },
      { initial_status: :waiting_list, new_status: 'accepted' },
      { initial_status: :waiting_list, new_status: 'rejected' },
      { initial_status: :accepted, new_status: 'pending' },
      { initial_status: :accepted, new_status: 'waiting_list' },
      { initial_status: :accepted, new_status: 'accepted' },
      { initial_status: :accepted, new_status: 'rejected' },
      { initial_status: :cancelled, new_status: 'accepted' },
      { initial_status: :cancelled, new_status: 'waiting_list' },
      { initial_status: :cancelled, new_status: 'rejected' },
    ].each do |params|
      it_behaves_like 'invalid user status updates', params[:initial_status], params[:new_status]
    end

    RSpec.shared_examples 'user cant update rejected registration' do |initial_status, new_status|
      it "user cant change 'status' => #{initial_status} to: #{new_status}" do
        registration = create(:registration, competing_status: initial_status.to_s, competition: competition)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          competing: { 'status' => new_status },
        )
        api_sign_in_as(registration.user)

        patch api_v1_registration_path(registration), params: update_request
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
    let(:competition) { create(:competition, :registration_open, :editable_registrations, :with_competitor_limit, :with_organizer) }

    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:user3) { create(:user) }

    let(:registration1) { create(:registration, competition: competition, user: user1) }
    let(:registration2) { create(:registration, competition: competition, user: user2) }
    let(:registration3) { create(:registration, competition: competition, user: user3) }
    let(:user_ids) { [registration1.user.id, registration2.user.id, registration3.user.id] }

    it 'admin submits a bulk update containing 1 update' do
      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      expect(response).to have_http_status(:ok)

      registration = Registration.find_by(user_id: registration1.user_id)

      expect(registration.competing_status).to eq('cancelled')

      history = registration.registration_history
      expect(history.length).to eq(1)
      expect(history.first[:changed_attributes][:competing_status]).to be_present
      expect(history.first[:action]).to eq('Admin delete')
    end

    it 'makes all changes in the given payload' do
      update_request1 = build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'cancelled' },
      )

      update_request2 = build(
        :update_request,
        user_id: registration2.user_id,
        competition_id: registration2.competition.id,
        guests: 3,
      )

      update_request3 = build(
        :update_request,
        user_id: registration3.user_id,
        competition_id: registration3.competition.id,
        competing: { 'event_ids' => %w[333 444] },
      )

      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [update_request1, update_request2, update_request3],
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body['updated_registrations'].count).to eq(3)

      expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('cancelled')
      expect(Registration.find_by(user_id: update_request2['user_id']).guests).to eq(3)
      expect(Registration.find_by(user_id: update_request3['user_id']).events.pluck(:id)).to eq(%w[333 444])
    end

    it 'fails if there are validation errors' do
      update_request1 = build(
        :update_request,
        user_id: registration1.user_id,
        competition_id: registration1.competition.id,
        competing: { 'status' => 'cancelled' },
      )

      update_request2 = build(
        :update_request,
        user_id: registration2.user_id,
        competition_id: registration2.competition.id,
        guests: 3,
      )

      update_request3 = build(
        :update_request,
        user_id: registration3.user_id,
        competition_id: registration3.competition.id,
        competing: { 'event_ids' => ['333', '444', 'goofy ah'] },
      )

      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [update_request1, update_request2, update_request3],
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      expect(response).to have_http_status(:unprocessable_content)

      expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('pending')
      expect(Registration.find_by(user_id: update_request2['user_id']).guests).to eq(10)
      expect(Registration.find_by(user_id: update_request3['user_id']).events.pluck(:id)).to eq(%w[333 333oh])
    end

    it 'returns 400 if blank JSON submitted' do
      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: {},
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      expect(response).to have_http_status(:bad_request)
    end

    it 'users cant submit bulk updates' do
      bulk_update_request = build(
        :bulk_update_request,
        submitted_by: registration1.user_id,
        user_ids: user_ids,
        competition_id: competition.id,
      )

      api_sign_in_as(registration1.user)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request
      error_json = {
        error: [Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS],
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'doesnt raise an error if all checks pass - single update' do
      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [registration1.user_id],
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
      )
      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      expect(response).to have_http_status(:ok)
    end

    it 'doesnt raise an error if all checks pass - 3 updates' do
      bulk_update_request = build(
        :bulk_update_request,
        user_ids: user_ids,
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
      )
      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      expect(response).to have_http_status(:ok)
    end

    it 'returns an array user_ids:error codes - 1 failure' do
      failed_update = build(
        :update_request, user_id: registration1.user_id, competition_id: registration1.competition.id, competing: { 'event_ids' => [] }
      )

      bulk_update_request = build(
        :bulk_update_request,
        user_ids: user_ids,
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [failed_update],
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request
      error_json = {
        error: { registration1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION },
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'returns an array user_ids:error codes - 2 validation failures' do
      failed_update = build(
        :update_request, user_id: registration1.user_id, competition_id: registration1.competition.id, competing: { 'event_ids' => [] }
      )
      failed_update_2 = build(
        :update_request, user_id: registration2.user_id, competition_id: registration2.competition.id, competing: { 'status' => 'random_status' }
      )
      normal_update = build(
        :update_request, user_id: registration3.user_id, competition_id: registration3.competition.id, competing: { 'status' => 'accepted' }
      )

      bulk_update_request = build(
        :bulk_update_request,
        user_ids: user_ids,
        submitted_by: competition.organizers.first.id,
        competition_id: competition.id,
        requests: [failed_update, failed_update_2, normal_update],
      )
      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      error_json = {
        error: {
          registration1[:user_id] => Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
          registration2[:user_id] => Registrations::ErrorCodes::INVALID_REQUEST_DATA,
        },
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'returns an error if the registration isnt found' do
      missing_registration_user_id = (registration1.user_id - 1)
      failed_update = build(:update_request, user_id: missing_registration_user_id, competition_id: registration1.competition.id)
      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [missing_registration_user_id],
        competition_id: registration1.competition.id,
        requests: [failed_update],
        submitted_by: competition.organizers.first.id,
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      error_json = {
        error: {
          missing_registration_user_id => Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
        },
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'returns errors array - validation failure and reg not found' do
      failed_update = build(
        :update_request, user_id: registration1.user_id, competition_id: registration1.competition.id, competing: { 'event_ids' => [] }
      )
      normal_update = build(
        :update_request, user_id: registration3.user_id, competition_id: registration3.competition.id, competing: { 'status' => 'accepted' }
      )

      missing_registration_user_id = 999_999_999
      failed_update2 = build(
        :update_request, user_id: missing_registration_user_id, competition_id: registration2.competition.id, competing: { 'status' => 'accepted' }
      )
      updates = [failed_update, normal_update, failed_update2]

      bulk_update_request = build(
        :bulk_update_request,
        user_ids: [registration1.user_id, registration3.user_id, missing_registration_user_id],
        competition_id: registration1.competition.id,
        requests: updates,
        submitted_by: competition.organizers.first.id,
      )

      api_sign_in_as(competition.organizers.first)
      patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

      error_json = {
        error: {
          registration1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
          missing_registration_user_id => Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
        },
      }.to_json

      expect(response.body).to eq(error_json)
      expect(response).to have_http_status(:unprocessable_content)
    end

    context 'when bulk accepting registrations' do
      let(:waitlisted1) { create(:registration, :waiting_list, competition: competition) }
      let(:waitlisted2) { create(:registration, :waiting_list, competition: competition) }
      let(:waitlisted3) { create(:registration, :waiting_list, competition: competition) }

      let(:update_request1) do
        build(
          :update_request,
          user_id: waitlisted1.user_id,
          competition_id: waitlisted1.competition.id,
          competing: { 'status' => 'accepted' },
        )
      end

      let(:update_request2) do
        build(
          :update_request,
          user_id: waitlisted2.user_id,
          competition_id: waitlisted2.competition.id,
          competing: { 'status' => 'accepted' },
        )
      end

      let(:update_request3) do
        build(
          :update_request,
          user_id: waitlisted3.user_id,
          competition_id: waitlisted3.competition.id,
          competing: { 'status' => 'accepted' },
        )
      end

      let(:bulk_update_request) do
        build(
          :bulk_update_request,
          user_ids: [waitlisted1.user_id],
          submitted_by: competition.organizers.first.id,
          competition_id: competition.id,
          requests: [update_request1, update_request2, update_request3],
        )
      end

      it 'accepts competitors from the waiting list if there is space in accepted' do
        api_sign_in_as(competition.organizers.first)
        patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

        expect(response).to have_http_status(:ok)

        expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request2['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request3['user_id']).competing_status).to eq('accepted')
      end

      it 'can accept competitors up to the competitor limit' do
        competition.update(competitor_limit: 3)

        api_sign_in_as(competition.organizers.first)
        patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

        expect(response).to have_http_status(:ok)

        expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request2['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request3['user_id']).competing_status).to eq('accepted')
      end

      it 'doesnt include non-competing registrations in competitor limit' do
        create(:registration, :non_competing, competition: competition)
        competition.update(competitor_limit: 3)

        api_sign_in_as(competition.organizers.first)
        patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request

        expect(response).to have_http_status(:ok)

        expect(Registration.find_by(user_id: update_request1['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request2['user_id']).competing_status).to eq('accepted')
        expect(Registration.find_by(user_id: update_request3['user_id']).competing_status).to eq('accepted')
      end

      it 'wont accept competitors over the competitor limit' do
        competition.update(competitor_limit: 2)

        api_sign_in_as(competition.organizers.first)
        patch bulk_update_api_v1_competition_registrations_path(competition), params: bulk_update_request
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET #list_admin' do
    let(:competition) { create(:competition, :registration_open, :editable_registrations, :with_organizer) }

    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:user3) { create(:user) }
    let(:user4) { create(:user) }
    let(:user5) { create(:user) }
    let(:user6) { create(:user) }

    let!(:registration1) { create(:registration, :accepted, competition: competition, user: user1) }
    let!(:registration2) { create(:registration, :accepted, competition: competition, user: user2) }
    let!(:registration3) { create(:registration, :accepted, competition: competition, user: user3) }
    let!(:registration4) { create(:registration, :waiting_list, competition: competition, user: user4) }
    let!(:registration5) { create(:registration, :waiting_list, competition: competition, user: user5) }
    let!(:registration6) { create(:registration, :waiting_list, competition: competition, user: user6) }

    it 'returns multiple registrations' do
      api_sign_in_as(competition.organizers.first)
      get admin_api_v1_competition_registrations_path(competition)

      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body.count).to eq(6)

      user_ids = [user1.id, user2.id, user3.id, user4.id, user5.id, user6.id]
      body.each do |data|
        expect(user_ids.include?(data['user_id'])).to be(true)
        if data['user_id'] == registration1[:user_id] || data['user_id'] == registration2[:user_id] || data['user_id'] == registration3[:user_id]
          expect(data.dig('competing', 'registration_status')).to eq('accepted')
          expect(data.dig('competing', 'waiting_list_position')).to be_nil
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
    let(:competition) { create(:competition, :registration_open, :with_organizer, :stripe_connected) }
    let(:reg) { create(:registration, :pending, competition: competition) }

    it 'successfully builds a payment_intent via Stripe API' do
      api_sign_in_as(reg.user)
      get payment_ticket_api_v1_registration_path(reg)
      expect(response).to be_successful
    end

    context 'successful payment ticket' do
      before do
        api_sign_in_as(reg.user)
        get payment_ticket_api_v1_registration_path(reg)
      end

      it 'returns a client secret' do
        expect(response.parsed_body.keys).to include('client_secret')
      end

      it 'creates a payment intent' do
        expect(PaymentIntent.find_by(holder_type: "Registration", holder_id: reg.id)).to be_present
      end

      it 'payment intent details match expected values' do
        payment_record = PaymentIntent.find_by(holder_type: "Registration", holder_id: reg.id).payment_record
        expect(payment_record.amount_stripe_denomination).to be(1000)
        expect(payment_record.currency_code).to eq("usd")
      end
    end

    it 'has the correct payment_intent properties when a donation is present' do
      api_sign_in_as(reg.user)
      get payment_ticket_api_v1_registration_path(reg), params: { iso_donation_amount: 1300 }

      payment_record = PaymentIntent.find_by(holder_type: "Registration", holder_id: reg.id).payment_record
      expect(payment_record.amount_stripe_denomination).to be(2300)
      expect(payment_record.currency_code).to eq("usd")
    end

    describe 'refuse ticket create request' do
      it 'if registration already paid' do
        create(:registration_payment, registration: reg)
        api_sign_in_as(reg.user)
        get payment_ticket_api_v1_registration_path(reg)

        body = response.parsed_body
        expect(response).to have_http_status(:forbidden)
        expect(body).to eq({ error: Registrations::ErrorCodes::NO_OUTSTANDING_PAYMENT }.with_indifferent_access)
      end

      it 'if registration is closed' do
        closed_comp = create(:competition, :registration_closed, :with_organizer, :stripe_connected)
        closed_reg = create(:registration, :pending, competition: closed_comp)

        api_sign_in_as(closed_reg.user)
        get payment_ticket_api_v1_registration_path(closed_reg)

        body = response.parsed_body
        expect(response).to have_http_status(:forbidden)
        expect(body).to eq({ error: Registrations::ErrorCodes::REGISTRATION_CLOSED }.with_indifferent_access)
      end
    end
  end

  describe 'GET #payment_denomination' do
    let(:competition) do
      create(:competition,
             :registration_open,
             :with_organizer,
             :stripe_connected,
             currency_code: "SEK",
             base_entry_fee_lowest_denomination: 1500)
    end
    let(:reg) { create(:registration, :pending, competition: competition) }

    it 'returns a hash of amounts/currencies formatted for payment providers' do
      expected_response = { api_amounts: { stripe: 1500, paypal: "15.00" }, human_amount: "15 kr (Swedish Krona)" }.with_indifferent_access
      api_sign_in_as(reg.user)
      get registration_payment_denomination_path(competition_id: competition.id, user_id: reg.user_id)

      expect(response).to be_successful
      expect(response.parsed_body).to eq(expected_response)
    end

    it 'allows a donation to be specified' do
      expected_response = { api_amounts: { stripe: 2500, paypal: "25.00" }, human_amount: "25 kr (Swedish Krona)" }.with_indifferent_access
      api_sign_in_as(reg.user)
      get registration_payment_denomination_path(competition_id: competition.id, user_id: reg.user_id), params: { iso_donation_amount: 1000 }

      expect(response).to be_successful
      expect(response.parsed_body).to eq(expected_response)
    end
  end

  describe 'PATCH #bulk_accept' do
    let(:auto_accept_comp) do
      create(
        :competition, :bulk_auto_accept, :registration_open, :with_organizer, :with_competitor_limit, competitor_limit: 10, auto_accept_disable_threshold: nil
      )
    end

    before do
      create_list(:registration, 5, :accepted, competition: auto_accept_comp)
    end

    it 'triggers bulk auto accept via API route' do
      waitlisted = create_list(:registration, 9, :paid, :waiting_list, competition: auto_accept_comp)
      create_list(:registration, 3, :paid, :pending, competition: auto_accept_comp)
      initial_pending_ids = auto_accept_comp.registrations.competing_status_pending.ids
      expected_accepted = auto_accept_comp.waiting_list.entries[..4]
      expected_remaining = auto_accept_comp.waiting_list.entries[5..] + initial_pending_ids

      api_sign_in_as(auto_accept_comp.organizers.first)
      patch bulk_auto_accept_api_v1_competition_registrations_path(competition_id: auto_accept_comp.id)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body[waitlisted.first.id.to_s]).to eq({ succeeded: true, info: 'accepted' }.stringify_keys)

      expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(10)
      expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(7)

      expect((expected_accepted - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

      expect(auto_accept_comp.waiting_list.reload.entries).to eq(expected_remaining)
    end

    it 'returns empty json if no registrations to be auto-accepted' do
      api_sign_in_as(auto_accept_comp.organizers.first)
      patch bulk_auto_accept_api_v1_competition_registrations_path(competition_id: auto_accept_comp.id)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq({})
    end
  end

  describe 'POST #stripe_webhook' do
    context 'with STRIPE_WEBHOOK_SECRET' do
      around do |example|
        original = ENV.fetch("STRIPE_WEBHOOK_SECRET", nil)
        ENV["STRIPE_WEBHOOK_SECRET"] = "expected_secret"
        example.run
        ENV["STRIPE_WEBHOOK_SECRET"] = original
      end

      it 'rejects a payload which does not match the webhook secret' do
        post registration_stripe_webhook_path, params: refund_webhook, as: :json
        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'handling refund.created' do
      let!(:competition) { create(:competition, :stripe_connected) }
      let(:account_id) { competition.competition_payment_integrations.first.connected_account.account_id }
      let(:registration) { create(:registration, competition: competition) }
      let!(:registration_payment) { create(:registration_payment, registration: registration) }
      let(:stripe_record) { registration_payment.receipt }

      context 'successful refund' do
        it 'returns success if target charge exists' do
          post registration_stripe_webhook_path, params: refund_webhook, as: :json
          expect(response).to be_successful
        end

        it 'returns 404 if charge not found' do
          post registration_stripe_webhook_path, params: refund_webhook(charge_id: 'not_our_charge_id'), as: :json
          expect(response).not_to be_successful
        end

        it 'creates a stripe_record for the refund' do
          post registration_stripe_webhook_path, params: refund_webhook, as: :json
          expect(StripeRecord.exists?(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg')).to be(true)
        end

        it 'creates a refund registration_payment for a full refund' do
          post registration_stripe_webhook_path, params: refund_webhook, as: :json
          expect(registration_payment.refunding_registration_payments.count).to be(1)

          expect(registration.outstanding_entry_fees.cents).to eq(1000)
        end

        it 'creates a refund registration_payment for a partial refund' do
          post registration_stripe_webhook_path, params: refund_webhook(amount: 500), as: :json
          expect(registration_payment.refunding_registration_payments.count).to be(1)
          expect(registration.reload.outstanding_entry_fees.cents).to eq(500)
        end
      end

      context 'does not create a refund if' do
        it 'the stripe refund isnt yet completed' do
          post registration_stripe_webhook_path, params: refund_webhook(status: 'pending'), as: :json
          expect(registration_payment.refunding_registration_payments.count).to be(0)
        end

        it 'the refund has already been recorded' do
          create(:registration_payment, :refund, refunded_registration_payment: registration_payment)
          post registration_stripe_webhook_path, params: refund_webhook(status: 'succeeded'), as: :json
          expect(registration_payment.refunding_registration_payments.count).to be(1)
          expect(RegistrationPayment.count).to be(2)
        end
      end
    end

    context 'refund.updated - full refund' do
      let!(:competition) { create(:competition, :stripe_connected) }
      let(:account_id) { competition.competition_payment_integrations.first.connected_account.account_id }
      let(:registration) { create(:registration, competition: competition) }
      let!(:registration_payment) { create(:registration_payment, registration: registration) }
      let(:receipt_record) { registration_payment.receipt }

      context 'if the target refund hasnt been recorded' do
        it 'creates a refund StripeRecord' do
          expect(StripeRecord.exists?(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg')).to be(false)

          post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated'), as: :json

          expect(response).to be_successful
          expect(StripeRecord.exists?(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg')).to be(true)
        end

        it 'sets the parent of that StripeRecord to the original charge' do
          expect(StripeRecord.exists?(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg')).to be(false)

          post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated'), as: :json

          expect(response).to be_successful
          expect(StripeRecord.find_by(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg').parent_record).to eq(receipt_record)
        end
      end

      it 'does nothing if the refund has already been recorded' do
        create(:registration_payment, :refund, registration: registration, refunded_registration_payment: registration_payment)

        expect(registration_payment.reload.refunding_registration_payments.count).to be(1)
        expect(registration.reload.outstanding_entry_fees.cents).to eq(1000)

        post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated'), as: :json

        expect(registration_payment.reload.refunding_registration_payments.count).to be(1)
        expect(registration.reload.outstanding_entry_fees.cents).to eq(1000)
      end

      it 'returns 404 if charge not found' do
        post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated', charge_id: 'not_our_charge'), as: :json
        expect(response).not_to be_successful
      end

      context 'updated from pending to successful' do
        let!(:refund_record) { create(:stripe_record, :pending_refund) }

        it 'doesnt create a refund if the stripe refund isnt yet completed' do
          post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated', status: 'failed'), as: :json
          expect(StripeRecord.find_by(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg').stripe_status).to eq('failed')
          expect(registration.outstanding_entry_fees.cents).to eq(0)
        end

        it 'returns success if target charge exists' do
          post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated'), as: :json
          expect(response).to be_successful
        end

        it 'updates the stripe_record status from pending to succeeded' do
          expect(StripeRecord.find_by(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg').stripe_status).to eq('pending')

          post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated'), as: :json

          expect(StripeRecord.find_by(stripe_id: 're_3RiDX8I8ds2wj1dZ0RDaaCQg').stripe_status).to eq('succeeded')
        end

        it 'creates a refund registration_payment for a successful full refund' do
          expect(registration_payment.refunding_registration_payments.count).to be(0)

          post registration_stripe_webhook_path, params: refund_webhook(type: 'refund.updated'), as: :json

          expect(registration_payment.refunding_registration_payments.count).to be(1)
          expect(registration.outstanding_entry_fees.cents).to eq(1000)
        end
      end
    end

    context 'refund.updated - partial refund' do
      let!(:competition) { create(:competition, :stripe_connected) }
      let(:account_id) { competition.competition_payment_integrations.first.connected_account.account_id }
      let!(:registration) { create(:registration, competition: competition) }
      let!(:registration_payment) { create(:registration_payment, registration: registration) }
      let(:receipt_record) { registration_payment.receipt }
      let!(:refund_record) { create(:stripe_record, :pending_refund, amount_stripe_denomination: 500) }

      it 'creates a refund registration_payment' do
        expect(registration_payment.refunding_registration_payments.count).to be(0)

        post registration_stripe_webhook_path, params: refund_webhook(amount: 500, type: 'refund.updated'), as: :json

        expect(registration_payment.refunding_registration_payments.count).to be(1)
        expect(registration.reload.outstanding_entry_fees.cents).to eq(500)
      end
    end
  end

  def refund_webhook(amount: 1000, currency: 'usd', charge_id: 'test_charge_id', status: 'succeeded', type: 'refund.created')
    {
      id: "evt_3RiDX8I8ds2wj1dZ0IsN0goY",
      account: "acct_19ZQVmE2qoiROdto",
      object: "event",
      api_version: "2025-04-30.basil",
      created: 1_751_888_912,
      data: {
        object: {
          id: "re_3RiDX8I8ds2wj1dZ0RDaaCQg",
          object: "refund",
          amount: amount,
          balance_transaction: "txn_3RiDX8I8ds2wj1dZ0WkucIWD",
          charge: charge_id,
          created: 1_751_888_912,
          currency: currency,
          destination_details: {
            card: {
              reference_status: "pending",
              reference_type: "acquirer_reference_number",
              type: "refund",
            },
            type: "card",
          },
          metadata: {},
          payment_intent: "pi_3RiDX8I8ds2wj1dZ0l44iwK5",
          reason: nil,
          receipt_number: nil,
          source_transfer_reversal: nil,
          status: status,
          transfer_reversal: nil,
        },
        previous_attributes: {},
      },
      livemode: false,
      pending_webhooks: 0,
      request: {
        id: "req_f56WK6ef8J0sKx",
        idempotency_key: "f14568d1-91bd-4a9d-ac14-1a4acf472423",
      },
      type: type,
    }
  end
end
