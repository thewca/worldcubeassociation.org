# frozen_string_literal: true

require 'rails_helper'
# TODO: Figure out if this is still needed, or if there's a better way now that we're in the monolith
require_relative '../../support/qualification_results_faker'

RSpec.describe Registrations::RegistrationChecker do
  let(:default_user) { FactoryBot.create(:user) }
  let(:default_competition) { FactoryBot.create(:competition, :registration_open, :editable_registrations, :with_organizer) }

  describe '#create' do
    describe '#create_registration_allowed!' do
      it 'guests can equal the maximum allowed' do
        registration_request = FactoryBot.build(
          :registration_request, guests: 10, competition_id: default_competition.id, user_id: default_user.id
        )
        FactoryBot.create(:competition, :with_guest_limit, :registration_open)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.not_to raise_error
      end

      it 'guests may equal 0' do
        registration_request = FactoryBot.build(:registration_request, guests: 0, competition_id: default_competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.not_to raise_error
      end

      it 'guests cant exceed 0 if not allowed' do
        competition = FactoryBot.create(:competition, :registration_open, guests_enabled: false)
        registration_request = FactoryBot.build(:registration_request, guests: 2, competition_id: competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED)
        end
      end

      it 'guests cannot exceed the maximum allowed' do
        competition = FactoryBot.create(:competition, :registration_open, :with_guest_limit)
        registration_request = FactoryBot.build(:registration_request, guests: 11, competition_id: competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request,
            User.find(registration_request['submitted_by']),
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED)
        end
      end

      it 'guests cannot be negative' do
        registration_request = FactoryBot.build(:registration_request, guests: -1, competition_id: default_competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'comment cant exceed character limit' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
          than 240 characterscomment longer than 240 characters'

        registration_request = FactoryBot.build(
          :registration_request, :comment, raw_comment: long_comment, competition_id: default_competition.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end

      it 'comment can match character limit' do
        at_character_limit = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than' \
                             '240 characterscomment longer longer than 240 12345'

        registration_request = FactoryBot.build(
          :registration_request, :comment, raw_comment: at_character_limit, competition_id: default_competition.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.not_to raise_error
      end

      it 'comment can be blank' do
        comment = ''
        registration_request = FactoryBot.build(
          :registration_request, :comment, raw_comment: comment, competition_id: default_competition.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.not_to raise_error
      end

      it 'comment must be included if required' do
        competition = FactoryBot.create(:competition, :registration_open, force_comment_in_registration: true)
        registration_request = FactoryBot.build(:registration_request, competition_id: competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING)
        end
      end

      it 'comment cant be blank if required' do
        competition = FactoryBot.create(:competition, :registration_open, force_comment_in_registration: true)
        registration_request = FactoryBot.build(
          :registration_request, :comment, raw_comment: '', competition_id: competition.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING)
        end
      end
    end

    describe '#create_registration_allowed!.user_can_create_registration!' do
      it 'user can create a registration' do
        registration_request = FactoryBot.build(:registration_request, competition_id: default_competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.not_to raise_error
      end

      it 'users can only register for themselves' do
        registration_request = FactoryBot.build(:registration_request, :impersonation, competition_id: default_competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end

      it 'user cant register if registration is closed' do
        competition = FactoryBot.create(:competition, :registration_closed)
        registration_request = FactoryBot.build(:registration_request, competition_id: competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::REGISTRATION_CLOSED)
          expect(error.status).to eq(:forbidden)
        end
      end

      it 'organizers can register before registration opens' do
        competition = FactoryBot.create(:competition, :registration_not_opened, :with_organizer)
        registration_request = FactoryBot.build(:registration_request, competition_id: competition.id, user_id: competition.organizers.first.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.not_to raise_error
      end

      it 'organizers cannot create registrations for users' do
        competition = FactoryBot.create(:competition, :registration_open, :with_organizer)
        registration_request = FactoryBot.build(
          :registration_request,
          competition_id: default_competition.id,
          user_id: default_user.id,
          submitted_by: competition.organizers.first.id,
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end

      it 'can register if ban ends before competition starts' do
        briefly_banned_user = FactoryBot.create(:user, :briefly_banned)
        registration_request = FactoryBot.build(:registration_request, competition_id: default_competition.id, user_id: briefly_banned_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.not_to raise_error
      end

      it 'cant register if ban ends after competition starts' do
        banned_user = FactoryBot.create(:user, :banned)
        registration_request = FactoryBot.build(:registration_request, competition_id: default_competition.id, user_id: banned_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_CANNOT_COMPETE)
        end
      end

      it 'user with incomplete profile cant register' do
        user = FactoryBot.create(:user, :incomplete)
        registration_request = FactoryBot.build(:registration_request, :incomplete, competition_id: default_competition.id, user_id: user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_CANNOT_COMPETE)
        end
      end

      it 'doesnt leak data if user tries to register for a banned user' do
        banned_user = FactoryBot.create(:user, :banned)
        registration_request = FactoryBot.build(
          :registration_request, :banned, :impersonation, competition_id: default_competition.id, user_id: banned_user.id, submitted_by: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end

      it 'doesnt leak data if organizer tries to register for a banned user' do
        banned_user = FactoryBot.create(:user, :banned)
        competition = FactoryBot.create(:competition, :registration_open, :with_organizer)
        organizer_id = competition.organizers.first.id
        registration_request = FactoryBot.build(
          :registration_request, :incomplete, :impersonation, competition_id: competition.id, user_id: banned_user.id, submitted_by: organizer_id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end

      it 'can register if this is the first registration in a series' do
        series = FactoryBot.create(:competition_series)
        competitionA = FactoryBot.create(:competition, :registration_open, competition_series: series)
        FactoryBot.create(:competition, :registration_open, competition_series: series, series_base: competitionA)

        registration_request = FactoryBot.build(:registration_request, competition_id: competitionA.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.not_to raise_error
      end

      it 'cant register if already have a non-cancelled registration for another series competition' do
        registration = FactoryBot.create(:registration, :accepted)

        series = FactoryBot.create(:competition_series)
        competitionA = registration.competition
        competitionA.update!(competition_series: series)
        competitionB = FactoryBot.create(:competition, :registration_open, competition_series: series, series_base: competitionA)

        user = registration.user

        registration_request = FactoryBot.build(:registration_request, competition_id: competitionB.id, user_id: user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES)
          expect(error.status).to eq(:forbidden)
        end
      end

      it 'can register if they have a cancelled registration for another series comp' do
        registration = FactoryBot.create(:registration, :deleted) # TODO: We need to bring in the new registration statuses

        series = FactoryBot.create(:competition_series)
        competitionA = registration.competition
        competitionA.update!(competition_series: series)
        competitionB = FactoryBot.create(:competition, :registration_open, competition_series: series, series_base: competitionA)

        user = registration.user

        registration_request = FactoryBot.build(:registration_request, competition_id: competitionB.id, user_id: user.id)

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.not_to raise_error
      end
    end

    describe '#create_registration_allowed!.validate_create_events!' do
      let(:event_limit_comp) {
        FactoryBot.create(
          :competition,
          :registration_open,
          events_per_registration_limit: 5,
          event_ids: ['333', '333oh', '222', '444', '555', '666', '777'],
        )
      }

      it 'user must have events selected' do
        registration_request = FactoryBot.build(
          :registration_request, events: [], competition_id: default_competition.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'events must be held at the competition' do
        registration_request = FactoryBot.build(
          :registration_request, events: ['333', '333fm'], competition_id: default_competition.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['submitted_by'])
          )
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'competitor can register up to the events_per_registration_limit limit' do
        registration_request = FactoryBot.build(
          :registration_request, events: ['333', '222', '444', '555', '666'], competition_id: event_limit_comp.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.not_to raise_error
      end

      it 'competitor cant register more events than the events_per_registration_limit' do
        registration_request = FactoryBot.build(
          :registration_request, events: ['333', '222', '444', '555', '666', '777'], competition_id: event_limit_comp.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'organizer cant register more events than the events_per_registration_limit' do
        registration_request = FactoryBot.build(
          :registration_request, events: ['333', '222', '444', '555', '666', '777'], competition_id: event_limit_comp.id, user_id: default_user.id
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end
    end

    describe '#create_registration_allowed!.validate_qualifications!' do
      let(:past_competition) { FactoryBot.create(:competition, :past) }

      let(:unenforced_easy_qualifications) { FactoryBot.create(:competition, :registration_open, :unenforced_easy_qualifications) }
      let(:unenforced_hard_qualifications) { FactoryBot.create(:competition, :registration_open, :unenforced_hard_qualifications) }

      let(:comp_with_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_easy_qualifications) }
      let(:enforced_hard_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_hard_qualifications) }
      let(:easy_future_qualifications) { FactoryBot.create(:competition, :registration_open, :easy_future_qualifications, :with_organizer) }
      let(:past_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_past_qualifications) }

      let(:user_with_results) { FactoryBot.create(:user, :wca_id) }
      let(:user_without_results) { FactoryBot.create(:user, :wca_id) }
      let(:dnfs_only) { FactoryBot.create(:user, :wca_id) }

      before do
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '222', best: 400, average: 500)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '333', best: 410, average: 510)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '555', best: 420, average: 520)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '444', best: 430, average: 530)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: 'pyram', best: 440, average: 540)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: 'minx', best: 450, average: 550)

        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '222', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '333', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '555', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '444', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: 'pyram', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: 'minx', best: -1, average: -1)
      end

      it 'smoketest - succeeds when all qualifications are met' do
        registration_request = FactoryBot.build(
          :registration_request,
          events: ['222', '333oh', '333', '555', '444', 'pyram', 'minx'],
          user_id: user_with_results.id,
          competition_id: comp_with_qualifications.id,
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.not_to raise_error
      end

      it 'smoketest - all qualifications unmet' do
        registration_request = FactoryBot.build(
          :registration_request,
          events: ['222', '333oh', '333', '555', '444', 'pyram', 'minx'],
          user_id: default_user.id,
          competition_id: enforced_hard_qualifications.id,
        )

        expect {
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.data.sort).to eq(['333', '222', 'pyram', 'minx', '555', '444'].sort)
        end
      end

      RSpec.shared_examples 'succeed: qualification not enforced' do |event_ids|
        it "user with not good enough results: can register given #{event_ids}" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: unenforced_hard_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.not_to raise_error
        end

        it "user with no results: can register given #{event_ids}" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_without_results.id,
            competition_id: unenforced_hard_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.not_to raise_error
        end

        it "user with good enough results: can register given #{event_ids}" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: unenforced_easy_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.not_to raise_error
        end
      end

      context 'succeed: qualification not enforced' do
        it_behaves_like 'succeed: qualification not enforced', ['333']
        it_behaves_like 'succeed: qualification not enforced', ['555']
        it_behaves_like 'succeed: qualification not enforced', ['222']
        it_behaves_like 'succeed: qualification not enforced', ['444']
        it_behaves_like 'succeed: qualification not enforced', ['pyram']
        it_behaves_like 'succeed: qualification not enforced', ['minx']
      end

      RSpec.shared_examples 'succeed: qualification enforced' do |description, event_ids|
        it description.to_s do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.not_to raise_error
        end

        it "future qualification date: #{description}" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: easy_future_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.not_to raise_error
        end
      end

      context 'succeed: qualification enforced' do
        it_behaves_like 'succeed: qualification enforced', 'can register when 333 faster than attemptResult-single', ['333']
        it_behaves_like 'succeed: qualification enforced', 'can register when 555 faster than attemptResult-average', ['555']
        it_behaves_like 'succeed: qualification enforced', 'can register when 222 single exists for anyResult-single', ['222']
        it_behaves_like 'succeed: qualification enforced', 'can register when 444 average exists for anyResult-average', ['444']
        it_behaves_like 'succeed: qualification enforced', 'can register when pyram single exists for ranking-single', ['pyram']
        it_behaves_like 'succeed: qualification enforced', 'can register when minx average exists for ranking-average', ['minx']
      end

      RSpec.shared_examples 'fail: qualification enforced' do |event_ids|
        it "cant register for #{event_ids} if result is achieved too late" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: past_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is nil" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: user_without_results.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is DNF" do
          registration_request = FactoryBot.build(
            :registration_request,
            events: event_ids,
            user_id: dnfs_only.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end
      end

      context 'fail: qualification enforced' do
        it_behaves_like 'fail: qualification enforced', ['333']
        it_behaves_like 'fail: qualification enforced', ['555']
        it_behaves_like 'fail: qualification enforced', ['222']
        it_behaves_like 'fail: qualification enforced', ['444']
        it_behaves_like 'fail: qualification enforced', ['pyram']
        it_behaves_like 'fail: qualification enforced', ['minx']
      end

      context 'fail: attemptResult not met' do
        it 'cant register when 333 slower than attemptResult-single' do
          slow_single = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_single.person, eventId: '333', best: 4000, average: 5000)

          registration_request = FactoryBot.build(
            :registration_request,
            events: ['333'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 333 equal to attemptResult-single' do
          slow_single = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_single.person, eventId: '333', best: 1000, average: 1500)

          registration_request = FactoryBot.build(
            :registration_request,
            events: ['333'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 555 slower than attemptResult-average' do
          slow_single = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_single.person, eventId: '555', best: 1000, average: 6001)

          registration_request = FactoryBot.build(
            :registration_request,
            events: ['555'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end

        it 'cant register when 555 equal to attemptResult-average' do
          slow_single = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_single.person, eventId: '555', best: 1000, average: 6000)

          registration_request = FactoryBot.build(
            :registration_request,
            events: ['555'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect {
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end
      end
    end
  end

  describe '#update' do
    let(:default_registration) { FactoryBot.create(:registration, competition: default_competition) }

    describe '#update_registration_allowed!.user_can_modify_registration!' do
      it 'raises error if registration doesnt exist' do
        update_request = FactoryBot.build(:update_request, competition_id: default_competition.id, user_id: default_user.id)

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::REGISTRATION_NOT_FOUND)
          expect(error.status).to eq(:not_found)
        end
      end

      it 'user update payload is accepted' do
        update_request = FactoryBot.build(
          :update_request,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.not_to raise_error
      end

      it 'User A cant change User Bs registration' do
        update_request = FactoryBot.build(
          :update_request,
          :for_another_user,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end

      it 'user cant update registration if registration edits arent allowed' do
        edits_not_allowed = FactoryBot.create(:competition, :registration_open)
        registration = FactoryBot.create(:registration, competition: edits_not_allowed)

        update_request = FactoryBot.build(
          :update_request,
          competition_id: registration.competition.id,
          user_id: registration.user_id,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED)
        end
      end

      it 'user cant change events after event change deadline' do
        edit_deadline_passed = FactoryBot.create(:competition, :event_edit_passed)
        registration = FactoryBot.create(:registration, competition: edit_deadline_passed)

        update_request = FactoryBot.build(
          :update_request,
          competition_id: registration.competition.id,
          user_id: registration.user_id,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED)
        end
      end

      it 'organizer can change user registration' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
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

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end
    end

    describe '#update_registration_allowed!.validate_comment!' do
      it 'user can change comment' do
        update_request = FactoryBot.build(
          :update_request,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
          competing: { 'comment' => 'new comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user cant exceed comment length' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
          than 240 characterscomment longer than 240 characters'

        update_request = FactoryBot.build(
          :update_request,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
          competing: { 'comment' => long_comment },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end

      it 'user can match comment length' do
        at_character_limit = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than' \
                             '240 characterscomment longer longer than 240 12345'

        update_request = FactoryBot.build(
          :update_request,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
          competing: { 'comment' => at_character_limit },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'comment can be blank' do
        update_request = FactoryBot.build(
          :update_request,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
          competing: { 'comment' => '' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'cant set comment to blank if required' do
        comment_required = FactoryBot.create(:competition, :editable_registrations, :registration_closed, force_comment_in_registration: true)
        registration = FactoryBot.create(:registration, competition: comment_required, comments: 'test')

        update_request = FactoryBot.build(
          :update_request,
          competition_id: registration.competition.id,
          user_id: registration.user_id,
          competing: { 'comment' => '' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING)
        end
      end

      it 'mandatory comment: updates without comments are allowed as long as a comment already exists in the registration' do
        comment_required = FactoryBot.create(:competition, :editable_registrations, :registration_closed, force_comment_in_registration: true)
        registration = FactoryBot.create(:registration, competition: comment_required, comments: 'test')

        update_request = FactoryBot.build(
          :update_request,
          competition_id: registration.competition.id,
          user_id: registration.user_id,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'oranizer can change registration state when comment is mandatory' do
        comment_required = FactoryBot.create(
          :competition, :editable_registrations, :registration_closed, :with_organizer, force_comment_in_registration: true
        )
        registration = FactoryBot.create(:registration, competition: comment_required, comments: 'test')

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          submitted_by: comment_required.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'organizer can change user comment' do
        registration = FactoryBot.create(:registration, competition: default_competition, comments: 'test')

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'comment' => 'heres a random different comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'organizer cant exceed comment length' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
          than 240 characterscomment longer than 240 characters'

        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'comment' => long_comment },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
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

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED)
        end
      end
    end

    describe '#update_registration_allowed!.validate_organizer_fields!' do
      it 'organizer can add organizer_comment' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'organizer_comment' => 'this is an admin comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'organizer can change organizer_comment' do
        registration = FactoryBot.create(
          :registration, user_id: default_user.id, competition_id: default_competition.id, administrative_notes: 'organizer comment'
        )

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'organizer_comment' => 'this is an admin comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user cant submit an organizer comment' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'organizer_comment' => 'this is an admin comment' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end

      it 'user cant submit waiting_list_position' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'waiting_list_position' => '1' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
        end
      end
    end

    describe '#update_registration_allowed!.validate_organizer_comment!' do
      it 'organizer comment cant exceed 240 characters' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
        than 240 characterscomment longer than 240 characters'

        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'organizer_comment' => long_comment },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end

      it 'organizer comment can match 240 characters' do
        at_character_limit = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than' \
                             '240 characterscomment longer longer than 240 12345'

        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'organizer_comment' => at_character_limit },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end
    end

    describe '#update_registration_allowed!.validate_guests!' do
      it 'user can change number of guests' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          guests: 4,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'guests cant exceed guest limit' do
        competition = FactoryBot.create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = FactoryBot.create(:registration, competition: competition, user: default_user)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          guests: 14,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'guests can match guest limit' do
        competition = FactoryBot.create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = FactoryBot.create(:registration, competition: competition, user: default_user)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          guests: 10,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.not_to raise_error
      end

      it 'guests can be zero' do
        competition = FactoryBot.create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = FactoryBot.create(:registration, competition: competition, user: default_user)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          guests: 0,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'guests cant be negative' do
        competition = FactoryBot.create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = FactoryBot.create(:registration, competition: competition, user: default_user)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          guests: -1,
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'guests have no limit if guest limit not set' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          guests: 99,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'organizer can change number of guests' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          guests: 5,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
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

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED)
        end
      end

      it 'organizer can change guests after registration change deadline' do
        competition = FactoryBot.create(:competition, :event_edit_passed, :with_organizer)
        registration = FactoryBot.create(:registration, competition: competition)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          submitted_by: competition.organizers.first.id,
          guests: 5,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end
    end

    describe '#update_registration_allowed!.validate_update_status!' do
      it 'user cant submit an invalid status' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'status' => 'invalid_status' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'organizer cant submit an invalid status' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'status' => 'invalid_status' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'organizer can accept registrations when there is no competitor limit', :tag do
        no_competitor_limit = FactoryBot.create(:competition, :with_organizer)
        registration = FactoryBot.create(:registration, competition: competitor_limit)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          submitted_by: no_competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'organizer cant accept a user when registration list is exactly full' do
        competitor_limit = FactoryBot.create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = FactoryBot.create(:registration, competition: competitor_limit)
        FactoryBot.create_list(:registration, 3, :accepted, competition: competitor_limit)

        update_request = FactoryBot.build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition.id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED)
          expect(error.status).to eq(:forbidden)
        end
      end

      it 'organizer cant accept a user when registration list is over full' do
        competitor_limit = FactoryBot.create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = FactoryBot.create(:registration, competition: competitor_limit)
        FactoryBot.create_list(:registration, 4, :accepted, competition: competitor_limit)

        update_request = FactoryBot.build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition.id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED)
          expect(error.status).to eq(:forbidden)
        end
      end

      it 'organizer can accept registrations up to the limit' do
        competitor_limit = FactoryBot.create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = FactoryBot.create(:registration, competition: competitor_limit)
        FactoryBot.create_list(:registration, 2, :accepted, competition: competitor_limit)

        update_request = FactoryBot.build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition.id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user can change state to deleted' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'status' => 'deleted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user cant change events when deleting' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'status' => 'cancelled', 'event_ids' => ['333'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'user can change state from cancelled to pending' do
        deleted_reg = FactoryBot.create(:registration, :deleted, competition: default_competition)

        update_request = FactoryBot.build(
          :update_request,
          user_id: deleted_reg.user_id,
          competition_id: deleted_reg.competition.id,
          competing: { 'status' => 'pending' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user cant delete accepted registration if competition requires organizers to cancel registration' do
        cant_cancel = FactoryBot.create(
          :competition, :registration_closed, :editable_registrations, allow_registration_self_delete_after_acceptance: false
        )
        accepted_reg = FactoryBot.create(:registration, :accepted, competition: cant_cancel)

        update_request = FactoryBot.build(
          :update_request,
          user_id: accepted_reg.user_id,
          competition_id: accepted_reg.competition.id,
          competing: { 'status' => 'deleted' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unauthorized)
          expect(error.error).to eq(Registrations::ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION)
        end
      end

      it 'user can cancel non-accepted registration if competition requires organizers to cancel registration' do
        cant_cancel = FactoryBot.create(
          :competition, :registration_closed, :editable_registrations, allow_registration_self_delete_after_acceptance: false
        )
        not_accepted_reg = FactoryBot.create(:registration, competition: cant_cancel)

        update_request = FactoryBot.build(
          :update_request,
          user_id: not_accepted_reg.user_id,
          competition_id: not_accepted_reg.competition.id,
          competing: { 'status' => 'deleted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
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
          competing: { 'status' => 'deleted' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED)
        end
      end

      it 'organizer can cancel registration after registration ends' do
        editing_over = FactoryBot.create(
          :competition, :registration_closed, :event_edit_passed, :with_organizer
        )
        registration = FactoryBot.create(:registration, competition: editing_over)

        update_request = FactoryBot.build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition.id,
          submitted_by: editing_over.organizers.first.id,
          competing: { 'status' => 'deleted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      RSpec.shared_examples 'invalid user status updates' do |initial_status, new_status|
        it "user cant change 'status' => #{initial_status} to: #{new_status}" do
          registration = FactoryBot.create(:registration, initial_status, competition: default_competition)

          update_request = FactoryBot.build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition.id,
            competing: { 'status' => new_status },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.status).to eq(:unauthorized)
            expect(error.error).to eq(Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
          end
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
        { initial_status: :deleted, new_status: 'accepted' },
        { initial_status: :deleted, new_status: 'waiting_list' },
        { initial_status: :deleted, new_status: 'rejected' },
      ].each do |params|
        it_behaves_like 'invalid user status updates', params[:initial_status], params[:new_status]
      end

      RSpec.shared_examples 'user cant update rejected registration' do |initial_status, new_status|
        it "user cant change 'status' => #{initial_status} to: #{new_status}" do
          registration = FactoryBot.create(:registration, initial_status, competition: default_competition)

          update_request = FactoryBot.build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition.id,
            competing: { 'status' => new_status },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.status).to eq(:unauthorized)
            expect(error.error).to eq(Registrations::ErrorCodes::REGISTRATION_IS_REJECTED)
          end
        end
      end

      [
        { initial_status: :rejected, new_status: 'deleted' },
        { initial_status: :rejected, new_status: 'accepted' },
        { initial_status: :rejected, new_status: 'waiting_list' },
        { initial_status: :rejected, new_status: 'pending' },
      ].each do |params|
        it_behaves_like 'user cant update rejected registration', params[:initial_status], params[:new_status]
      end

      RSpec.shared_examples 'valid organizer status updates' do |initial_status, new_status|
        it "organizer can change 'status' => #{initial_status} to: #{new_status} before close" do
          registration = FactoryBot.create(:registration, initial_status, competition: default_competition)

          update_request = FactoryBot.build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition.id,
            competing: { 'status' => new_status },
            submitted_by: default_competition.organizers.first.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
            .not_to raise_error
        end

        it "site admin can change 'status' => #{initial_status} to: #{new_status} before close" do
          admin = FactoryBot.create(:admin)
          registration = FactoryBot.create(:registration, initial_status, competition: default_competition)

          update_request = FactoryBot.build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition.id,
            competing: { 'status' => new_status },
            submitted_by: admin.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
            .not_to raise_error
        end

        it "after edit deadline/reg close, organizer can change 'status' => #{initial_status} to: #{new_status}" do
          competition = FactoryBot.create(:competition, :with_organizer, :event_edit_passed)
          registration = FactoryBot.create(:registration, initial_status, competition: competition)

          update_request = FactoryBot.build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition.id,
            competing: { 'status' => new_status },
            submitted_by: competition.organizers.first.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
            .not_to raise_error
        end
      end

      [
        { initial_status: :pending, new_status: 'accepted' },
        { initial_status: :pending, new_status: 'waiting_list' },
        { initial_status: :pending, new_status: 'deleted' },
        { initial_status: :pending, new_status: 'pending' },
        { initial_status: :pending, new_status: 'rejected' },
        { initial_status: :waiting_list, new_status: 'pending' },
        { initial_status: :waiting_list, new_status: 'deleted' },
        { initial_status: :waiting_list, new_status: 'waiting_list' },
        { initial_status: :waiting_list, new_status: 'accepted' },
        { initial_status: :waiting_list, new_status: 'rejected' },
        { initial_status: :accepted, new_status: 'pending' },
        { initial_status: :accepted, new_status: 'deleted' },
        { initial_status: :accepted, new_status: 'waiting_list' },
        { initial_status: :accepted, new_status: 'accepted' },
        { initial_status: :accepted, new_status: 'rejected' },
        { initial_status: :deleted, new_status: 'accepted' },
        { initial_status: :deleted, new_status: 'pending' },
        { initial_status: :deleted, new_status: 'waiting_list' },
        { initial_status: :deleted, new_status: 'rejected' },
        { initial_status: :deleted, new_status: 'deleted' },
        { initial_status: :rejected, new_status: 'accepted' },
        { initial_status: :rejected, new_status: 'pending' },
        { initial_status: :rejected, new_status: 'waiting_list' },
        { initial_status: :rejected, new_status: 'deleted' },
      ].each do |params|
        it_behaves_like 'valid organizer status updates', params[:initial_status], params[:new_status]
      end
    end

    describe '#update_registration_allowed!.validate_update_events!' do
      let(:events_limit) { FactoryBot.create(:competition, :with_organizer, :editable_registrations, :registration_open, :with_event_limit) }
      let(:limited_registration) { FactoryBot.create(:registration, competition: events_limit) }

      it 'user can add events' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'event_ids' => ['333', '444', '555', 'minx'] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user can remove events' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'event_ids' => ['333'] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'user can remove all old events and register for new ones' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'event_ids' => ['pyram', 'minx'] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'events list cant be blank' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'event_ids' => [] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'events must be held at the competition' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'event_ids' => ['333', '333fm'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'events must exist' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          competing: { 'event_ids' => ['888', '333'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'organizer can change a users events' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'event_ids' => ['333', '555'] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'organizer cant change users events to events not held at competition' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'event_ids' => ['333', '333fm'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'competitor can update registration with events up to the events_per_registration_limit limit' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: limited_registration.user_id,
          competition_id: limited_registration.competition.id,
          competing: { 'event_ids' => ['333', '333oh', '555', 'pyram', 'minx'] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by'])) }
          .not_to raise_error
      end

      it 'competitor cant update registration to more events than the events_per_registration_limit' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: limited_registration.user_id,
          competition_id: limited_registration.competition.id,
          competing: { 'event_ids' => ['333', '333oh', '555', 'pyram', 'minx', '222'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'organizer cant update their registration with more events than the events_per_registration_limit' do
        organizer_reg = FactoryBot.create(:registration, user: events_limit.organizers.first, competition: events_limit)

        update_request = FactoryBot.build(
          :update_request,
          user_id: organizer_reg.user_id,
          competition_id: organizer_reg.competition.id,
          competing: { 'event_ids' => ['333', '333oh', '555', 'pyram', 'minx', '222'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end
    end

    describe '#update_registration_allowed!.validate_waiting_list_position!' do
      let(:waiting_list) { FactoryBot.create(:waiting_list, holder: default_competition) }

      before do
        waiting_list.add(FactoryBot.create(:registration, :waiting_list, competition: default_competition).user_id)
        waiting_list.add(FactoryBot.create(:registration, :waiting_list, competition: default_competition).user_id)
        waiting_list.add(FactoryBot.create(:registration, :waiting_list, competition: default_competition).user_id)
        waiting_list.add(FactoryBot.create(:registration, :waiting_list, competition: default_competition).user_id)
      end

      it 'must be an integer, not string' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 'b' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'can be an integer given as a string' do
        default_competition.waiting_list.add(default_registration.user_id)

        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => '1' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.not_to raise_error
      end

      it 'must be an integer, not float' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 2.0 },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'cannot move to less than position 1' do
        waiting_list.add(default_registration.user_id)

        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 0 },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'cannot move to greater than the number of items in the waiting list' do
        waiting_list.add(default_registration.user_id)

        update_request = FactoryBot.build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition.id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 6 },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:forbidden)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end
    end

    describe '#update_registration_allowed!.validate_qualifications!' do
      let(:past_competition) { FactoryBot.create(:competition, :past) }

      let(:unenforced_easy_qualifications) { FactoryBot.create(:competition, :registration_open, :unenforced_easy_qualifications, :editable_registrations) }
      let(:unenforced_hard_qualifications) { FactoryBot.create(:competition, :registration_open, :unenforced_hard_qualifications, :editable_registrations) }

      let(:easy_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_easy_qualifications, :editable_registrations) }
      let(:hard_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_hard_qualifications, :editable_registrations) }
      let(:easy_future_qualifications) { FactoryBot.create(:competition, :registration_open, :easy_future_qualifications, :editable_registrations, :with_organizer) }
      let(:past_qualifications) { FactoryBot.create(:competition, :registration_open, :enforces_past_qualifications, :editable_registrations) }

      let(:user_with_results) { FactoryBot.create(:user, :wca_id) }
      let(:user_without_results) { FactoryBot.create(:user, :wca_id) }
      let(:dnfs_only) { FactoryBot.create(:user, :wca_id) }

      let(:easy_registration_with_results_reg) {
        FactoryBot.create(
          :registration, :skip_validations, user: user_with_results, competition: easy_qualifications
        )
      }

      before do
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '222', best: 400, average: 500)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '333', best: 410, average: 510)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '555', best: 420, average: 520)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: '444', best: 430, average: 530)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: 'pyram', best: 440, average: 540)
        FactoryBot.create(:result, competition: past_competition, person: user_with_results.person, eventId: 'minx', best: 450, average: 550)

        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '222', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '333', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '555', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: '444', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: 'pyram', best: -1, average: -1)
        FactoryBot.create(:result, competition: past_competition, person: dnfs_only.person, eventId: 'minx', best: -1, average: -1)
      end

      it 'smoketest - succeeds when all qualifications are met' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: easy_registration_with_results_reg.user_id,
          competition_id: easy_registration_with_results_reg.competition.id,
          competing: { 'event_ids' => ['222', '333', '555', '444', 'pyram', 'minx'] },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.not_to raise_error
      end

      RSpec.shared_examples 'update succeed: qualification not enforced' do |event_ids|
        let(:reg_with_results_for_unenforced_hard_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_with_results, competition: unenforced_hard_qualifications
          )
        }

        let(:reg_with_no_results_for_unenforced_hard_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_without_results, competition: unenforced_hard_qualifications
          )
        }

        let(:reg_with_results_for_unenforced_easy_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_with_results, competition: unenforced_easy_qualifications
          )
        }

        it "user with not good enough results: can register given #{event_ids}" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: reg_with_results_for_unenforced_hard_quali.user_id,
            competition_id: reg_with_results_for_unenforced_hard_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.not_to raise_error
        end

        it "user with no results: can register given #{event_ids}" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: reg_with_no_results_for_unenforced_hard_quali.user_id,
            competition_id: reg_with_no_results_for_unenforced_hard_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.not_to raise_error
        end

        it "user with good enough results: can register given #{event_ids}" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: reg_with_results_for_unenforced_easy_quali.user_id,
            competition_id: reg_with_results_for_unenforced_easy_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.not_to raise_error
        end
      end

      context 'succeed: qualification not enforced' do
        it_behaves_like 'update succeed: qualification not enforced', ['333']
        it_behaves_like 'update succeed: qualification not enforced', ['555']
        it_behaves_like 'update succeed: qualification not enforced', ['222']
        it_behaves_like 'update succeed: qualification not enforced', ['444']
        it_behaves_like 'update succeed: qualification not enforced', ['pyram']
        it_behaves_like 'update succeed: qualification not enforced', ['minx']
      end

      RSpec.shared_examples 'update succeed: qualification enforced' do |description, event_ids|
        let(:reg_with_results_easy_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_with_results, competition: easy_qualifications
          )
        }

        let(:reg_with_results_future_easy_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_with_results, competition: easy_future_qualifications
          )
        }

        it description.to_s do
          update_request = FactoryBot.build(
            :update_request,
            user_id: reg_with_results_easy_quali.user_id,
            competition_id: reg_with_results_easy_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.not_to raise_error
        end

        it "future qualification date: #{description}" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: reg_with_results_future_easy_quali.user_id,
            competition_id: reg_with_results_future_easy_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.not_to raise_error
        end
      end

      context 'succeed: qualification enforced' do
        it_behaves_like 'update succeed: qualification enforced', 'can register when 333 faster than attemptResult-single', ['333']
        it_behaves_like 'update succeed: qualification enforced', 'can register when 555 faster than attemptResult-average', ['555']
        it_behaves_like 'update succeed: qualification enforced', 'can register when 222 single exists for anyResult-single', ['222']
        it_behaves_like 'update succeed: qualification enforced', 'can register when 444 average exists for anyResult-average', ['444']
        it_behaves_like 'update succeed: qualification enforced', 'can register when pyram average exists for ranking-single', ['pyram']
        it_behaves_like 'update succeed: qualification enforced', 'can register when minx average exists for ranking-average', ['minx']
      end

      RSpec.shared_examples 'update fail: qualification enforced' do |event_ids|
        let(:user_with_results_registering_for_past) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_with_results, competition: past_qualifications
          )
        }

        let(:user_without_results_easy_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: user_without_results, competition: easy_qualifications
          )
        }

        let(:user_with_dnfs_easy_quali) {
          FactoryBot.create(
            :registration, :skip_validations, user: dnfs_only, competition: easy_qualifications
          )
        }

        it "cant register for #{event_ids} if result is achieved too late" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: user_with_results_registering_for_past.user_id,
            competition_id: user_with_results_registering_for_past.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is nil" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: user_without_results_easy_quali.user_id,
            competition_id: user_without_results_easy_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is DNF" do
          update_request = FactoryBot.build(
            :update_request,
            user_id: user_with_dnfs_easy_quali.user_id,
            competition_id: user_with_dnfs_easy_quali.competition.id,
            competing: { 'event_ids' => event_ids },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end
      end

      context 'fail: qualification enforced' do
        it_behaves_like 'update fail: qualification enforced', ['333']
        it_behaves_like 'update fail: qualification enforced', ['555']
        it_behaves_like 'update fail: qualification enforced', ['222']
        it_behaves_like 'update fail: qualification enforced', ['444']
        it_behaves_like 'update fail: qualification enforced', ['pyram']
        it_behaves_like 'update fail: qualification enforced', ['minx']
      end

      context 'fail: attemptResult not met' do
        it 'cant register when 333 slower than attemptResult-single' do
          slow_single = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_single.person, eventId: '333', best: 1001, average: 5000)
          slow_single_reg = FactoryBot.create(:registration, :skip_validations, user: slow_single, competition: easy_qualifications)

          update_request = FactoryBot.build(
            :update_request,
            user_id: slow_single_reg.user_id,
            competition_id: slow_single_reg.competition.id,
            competing: { 'event_ids' => ['333'] },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 333 equal to attemptResult-single' do
          slow_single = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_single.person, eventId: '333', best: 1000, average: 1500)
          slow_single_reg = FactoryBot.create(:registration, :skip_validations, user: slow_single, competition: easy_qualifications)

          update_request = FactoryBot.build(
            :update_request,
            user_id: slow_single_reg.user_id,
            competition_id: slow_single_reg.competition.id,
            competing: { 'event_ids' => ['333'] },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 555 slower than attemptResult-average' do
          slow_average = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_average.person, eventId: '555', best: 1000, average: 6001)
          slow_average_reg = FactoryBot.create(:registration, :skip_validations, user: slow_average, competition: easy_qualifications)

          update_request = FactoryBot.build(
            :update_request,
            user_id: slow_average_reg.user_id,
            competition_id: slow_average_reg.competition.id,
            competing: { 'event_ids' => ['555'] },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end

        it 'cant register when 555 equal to attemptResult-average' do
          slow_average = FactoryBot.create(:user, :wca_id)
          FactoryBot.create(:result, competition: past_competition, person: slow_average.person, eventId: '555', best: 1000, average: 6000)
          slow_average_reg = FactoryBot.create(:registration, :skip_validations, user: slow_average, competition: easy_qualifications)

          update_request = FactoryBot.build(
            :update_request,
            user_id: slow_average_reg.user_id,
            competition_id: slow_average_reg.competition.id,
            competing: { 'event_ids' => ['555'] },
          )

          expect {
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
          }.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end
      end
    end

    describe '#update_registration_allowed!.updating series registrations' do
      let(:registrationA) { FactoryBot.create(:registration, :accepted) }

      let(:series) { FactoryBot.create(:competition_series) }
      let(:competitionA) { registrationA.competition }
      let(:competitionB) {
        FactoryBot.create(
          :competition, :registration_open, :editable_registrations, :with_organizer, competition_series: series, series_base: competitionA
        )
      }

      let(:registrationB) { FactoryBot.create(:registration, :deleted, competition: competitionB, user_id: registrationA.user.id) }

      before do
        competitionA.update!(competition_series: series)
      end

      it 'cant re-register (register after cancelling) if they have a registration for another series comp' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: registrationB.user.id,
          competition_id: competitionB.id,
          competing: { 'status' => 'pending' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES)
          expect(error.status).to eq(:forbidden)
        end
      end

      it 'organizer cant set status to accepted if attendee is accepted for another series comp' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: registrationB.user.id,
          competition_id: competitionB.id,
          submitted_by: competitionB.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES)
          expect(error.status).to eq(:forbidden)
        end
      end

      it 'organizer can update admin comment in attendees non-accepted series comp registration' do
        update_request = FactoryBot.build(
          :update_request,
          user_id: registrationB.user.id,
          competition_id: registrationB.competition.id,
          submitted_by: competitionB.organizers.first.id,
          competing: { 'admin_comment' => 'why they were cancelled' },
        )

        expect {
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, Competition.find(update_request['competition_id']), User.find(update_request['submitted_by']))
        }.not_to raise_error
      end
    end
  end

  describe '#bulk_update' do
    describe '#bulk_update_allowed!' do
      let(:registration_1) { FactoryBot.create(:registration, competition: default_competition) }
      let(:registration_2) { FactoryBot.create(:registration, competition: default_competition) }
      let(:registration_3) { FactoryBot.create(:registration, competition: default_competition) }
      let(:user_ids) { [registration_1.user_id, registration_2.user_id, registration_3.user_id] }

      it 'users cant submit bulk updates' do
        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          submitted_by: registration_1.user_id,
          user_ids: user_ids,
          competition_id: default_competition.id,
        )

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.to raise_error(WcaExceptions::BulkUpdateError) do |error|
          expect(error.errors).to eq([Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS])
          expect(error.status).to eq(:unauthorized)
        end
      end

      it 'doesnt raise an error if all checks pass - single update' do
        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          user_ids: [registration_1.user_id],
          submitted_by: default_competition.organizers.first.id,
          competition_id: default_competition.id,
        )

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.not_to raise_error
      end

      it 'doesnt raise an error if all checks pass - 3 updates' do
        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          user_ids: user_ids,
          submitted_by: default_competition.organizers.first.id,
          competition_id: default_competition.id,
        )

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.not_to raise_error
      end

      it 'returns an array user_ids:error codes - 1 failure' do
        failed_update = FactoryBot.build(
          :update_request, user_id: registration_1.user_id, competition_id: registration_1.competition.id, competing: { 'event_ids' => [] }
        )

        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          user_ids: user_ids,
          submitted_by: default_competition.organizers.first.id,
          competition_id: default_competition.id,
          requests: [failed_update],
        )

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.to raise_error(WcaExceptions::BulkUpdateError) do |error|
          expect(error.errors).to eq({ registration_1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION })
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'returns an array user_ids:error codes - 2 validation failures' do
        failed_update = FactoryBot.build(
          :update_request, user_id: registration_1.user_id, competition_id: registration_1.competition.id, competing: { 'event_ids' => [] }
        )
        failed_update_2 = FactoryBot.build(
          :update_request, user_id: registration_2.user_id, competition_id: registration_2.competition.id, competing: { 'status' => 'random_status' }
        )
        normal_update = FactoryBot.build(
          :update_request, user_id: registration_3.user_id, competition_id: registration_3.competition.id, competing: { 'status' => 'accepted' }
        )

        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          user_ids: user_ids,
          submitted_by: default_competition.organizers.first.id,
          competition_id: default_competition.id,
          requests: [failed_update, failed_update_2, normal_update],
        )

        error_json = {
          registration_1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
          registration_2[:user_id] => Registrations::ErrorCodes::INVALID_REQUEST_DATA,
        }

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.to raise_error(WcaExceptions::BulkUpdateError) do |error|
          expect(error.errors).to eq(error_json)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'returns an error if the registration isnt found' do
        missing_registration_user_id = (registration_1.user_id-1)
        failed_update = FactoryBot.build(:update_request, user_id: missing_registration_user_id, competition_id: registration_1.competition.id)
        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          user_ids: [missing_registration_user_id],
          competition_id: registration_1.competition.id,
          requests: [failed_update],
          submitted_by: default_competition.organizers.first.id,
        )

        error_json = {
          missing_registration_user_id => Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
        }

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.to raise_error(WcaExceptions::BulkUpdateError) do |error|
          expect(error.errors).to eq(error_json)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'returns errors array - validation failure and reg not found' do
        failed_update = FactoryBot.build(
          :update_request, user_id: registration_1.user_id, competition_id: registration_1.competition.id, competing: { 'event_ids' => [] }
        )
        normal_update = FactoryBot.build(
          :update_request, user_id: registration_3.user_id, competition_id: registration_3.competition.id, competing: { 'status' => 'accepted' }
        )

        missing_registration_user_id = (999_999_999)
        failed_update2 = FactoryBot.build(
          :update_request, user_id: missing_registration_user_id, competition_id: registration_2.competition.id, competing: { 'status' => 'accepted' }
        )
        updates = [failed_update, normal_update, failed_update2]

        bulk_update_request = FactoryBot.build(
          :bulk_update_request,
          user_ids: [registration_1.user_id, registration_3.user_id, missing_registration_user_id],
          competition_id: registration_1.competition.id,
          requests: updates,
          submitted_by: default_competition.organizers.first.id,
        )

        error_json = {
          registration_1.user_id => Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
          missing_registration_user_id => Registrations::ErrorCodes::REGISTRATION_NOT_FOUND,
        }

        expect {
          Registrations::RegistrationChecker.bulk_update_allowed!(bulk_update_request, User.find(bulk_update_request['submitted_by']))
        }.to raise_error(WcaExceptions::BulkUpdateError) do |error|
          expect(error.errors).to eq(error_json)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end
    end
  end
end
