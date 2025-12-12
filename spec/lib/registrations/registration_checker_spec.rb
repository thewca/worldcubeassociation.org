# frozen_string_literal: true

require 'rails_helper'
# TODO: Figure out if this is still needed, or if there's a better way now that we're in the monolith
require_relative '../../support/qualification_results_faker'

RSpec.describe Registrations::RegistrationChecker do
  let(:default_user) { create(:user) }
  let(:default_competition) { create(:competition, :registration_open, :editable_registrations, :with_organizer) }

  describe '#create' do
    describe '#create_registration_allowed!' do
      it 'can perform a full check without firing any DB writes', :clean_db_with_truncation do
        registration_request = build(
          :registration_request,
          competition_id: default_competition.id,
          user_id: default_user.id,
          guests: 10,
          raw_comment: 'This is a perfectly legitimate registration',
          events: %w[222 333 pyram],
        )

        ActiveRecord::Base.connected_to(role: :reading, prevent_writes: true) do
          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['submitted_by']), Competition.find(registration_request['competition_id'])
            )
          end.not_to raise_error
        end
      end

      describe 'validate_guests!' do
        it 'guests can equal the maximum allowed' do
          comp = create(:competition, :with_guest_limit, :registration_open)
          registration_request = build(
            :registration_request, guests: 10, competition_id: comp.id, user_id: default_user.id
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), comp
            )
          end.not_to raise_error
        end

        it 'guests may equal 0' do
          registration_request = build(:registration_request, guests: 0, competition_id: default_competition.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), default_competition
            )
          end.not_to raise_error
        end

        it 'guests cant exceed 0 if not allowed' do
          competition = create(:competition, :registration_open, guests_enabled: false)
          registration_request = build(:registration_request, guests: 2, competition_id: competition.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), competition
            )
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.error).to eq(Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED)
          end
        end

        it 'guests cannot exceed the maximum allowed' do
          competition = create(:competition, :registration_open, :with_guest_limit)
          registration_request = build(:registration_request, guests: 11, competition_id: competition.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request,
              User.find(registration_request['user_id']),
              competition,
            )
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.error).to eq(Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED)
          end
        end

        it 'guests cannot be negative' do
          registration_request = build(:registration_request, guests: -1, competition_id: default_competition.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), default_competition
            )
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
          end
        end

        it 'guests cant exceed reasonable limit if no guest limit enforced' do
          registration_request = build(:registration_request, guests: 100, competition_id: default_competition.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), default_competition
            )
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.error).to eq(Registrations::ErrorCodes::UNREASONABLE_GUEST_COUNT)
          end
        end

        it 'guest limit higher than default allowed if guests are restricted' do
          comp = create(:competition, :with_guest_limit, :registration_open, guests_per_registration_limit: 20)
          registration_request = build(:registration_request, guests: 20, competition_id: comp.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), comp
            )
          end.not_to raise_error
        end

        it 'guest limit higher than default not respected if guests arent restricted' do
          comp = create(:competition, :registration_open, guests_per_registration_limit: 120)
          registration_request = build(:registration_request, guests: 111, competition_id: comp.id, user_id: default_user.id)

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(
              registration_request, User.find(registration_request['user_id']), comp
            )
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::UNREASONABLE_GUEST_COUNT)
            expect(error.status).to eq(:unprocessable_entity)
          end
        end
      end

      it 'comment cant exceed character limit' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
          than 240 characterscomment longer than 240 characters'

        registration_request = build(
          :registration_request, :comment, raw_comment: long_comment, competition_id: default_competition.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), default_competition
          )
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end

      it 'comment can match character limit' do
        at_character_limit = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than' \
                             '240 characterscomment longer longer than 240 12345'

        registration_request = build(
          :registration_request, :comment, raw_comment: at_character_limit, competition_id: default_competition.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), default_competition
          )
        end.not_to raise_error
      end

      it 'comment can be blank' do
        comment = ''
        registration_request = build(
          :registration_request, :comment, raw_comment: comment, competition_id: default_competition.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), default_competition
          )
        end.not_to raise_error
      end

      it 'comment must be included if required' do
        competition = create(:competition, :registration_open, force_comment_in_registration: true)
        registration_request = build(:registration_request, competition_id: competition.id, user_id: default_user.id)

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), competition
          )
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING)
        end
      end

      it 'comment cant be blank if required' do
        competition = create(:competition, :registration_open, force_comment_in_registration: true)
        registration_request = build(
          :registration_request, :comment, raw_comment: '', competition_id: competition.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), competition
          )
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING)
        end
      end
    end

    describe '#create_registration_allowed!.validate_create_events!' do
      let(:event_limit_comp) do
        create(
          :competition,
          :registration_open,
          :with_event_limit,
          :with_organizer,
          event_ids: %w[333 333oh 222 444 555 666 777],
        )
      end

      it 'user must have events selected' do
        registration_request = build(
          :registration_request, events: [], competition_id: default_competition.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), default_competition
          )
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'events must be held at the competition' do
        registration_request = build(
          :registration_request, events: %w[333 333fm], competition_id: default_competition.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(
            registration_request, User.find(registration_request['user_id']), default_competition
          )
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'competitor can register up to the events_per_registration_limit limit' do
        registration_request = build(
          :registration_request, events: %w[333 222 444 555 666], competition_id: event_limit_comp.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), event_limit_comp)
        end.not_to raise_error
      end

      it 'competitor cant register more events than the events_per_registration_limit' do
        registration_request = build(
          :registration_request, events: %w[333 222 444 555 666 777], competition_id: event_limit_comp.id, user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), event_limit_comp)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'competitor can exceed event limit if event_restrictions not enforced' do
        unenforced_event_limit_comp = create(
          :competition,
          :registration_open,
          :with_event_limit,
          :skip_validations,
          event_restrictions: false,
          event_ids: %w[333 333oh 222 444 555 666 777],
        )

        registration_request = build(
          :registration_request, events: %w[333 222 444 555 666 777],
                                 competition_id: unenforced_event_limit_comp.id,
                                 user_id: default_user.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), unenforced_event_limit_comp)
        end.not_to raise_error
      end

      it 'organizer cant register more events than the events_per_registration_limit' do
        registration_request = build(
          :registration_request, events: %w[333 222 444 555 666 777], competition_id: event_limit_comp.id, user_id: event_limit_comp.organizers.first.id
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), event_limit_comp)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end
    end

    describe '#create_registration_allowed!.validate_qualifications!' do
      let(:past_competition) { create(:competition, :past) }

      let(:unenforced_easy_qualifications) { create(:competition, :registration_open, :unenforced_easy_qualifications) }
      let(:unenforced_hard_qualifications) { create(:competition, :registration_open, :unenforced_hard_qualifications) }

      let(:comp_with_qualifications) { create(:competition, :registration_open, :enforces_easy_qualifications) }
      let(:enforced_hard_qualifications) { create(:competition, :registration_open, :enforces_hard_qualifications) }
      let(:easy_future_qualifications) { create(:competition, :registration_open, :easy_future_qualifications, :with_organizer) }
      let(:past_qualifications) { create(:competition, :registration_open, :enforces_past_qualifications) }

      let(:user_with_results) { create(:user, :wca_id) }
      let(:user_without_results) { create(:user, :wca_id) }
      let(:dnfs_only) { create(:user, :wca_id) }

      before do
        round_222 = create(:round, competition: past_competition, event_id: "222")
        round_333 = create(:round, competition: past_competition, event_id: "333")
        round_555 = create(:round, competition: past_competition, event_id: "555")
        round_444 = create(:round, competition: past_competition, event_id: "444")
        round_pyram = create(:round, competition: past_competition, event_id: "pyram")
        round_minx = create(:round, competition: past_competition, event_id: "minx")
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '222', best: 400, average: 500, round: round_222)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '333', best: 410, average: 510, round: round_333)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '555', best: 420, average: 520, round: round_555)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '444', best: 430, average: 530, round: round_444)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: 'pyram', best: 440, average: 540, round: round_pyram)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: 'minx', best: 450, average: 550, round: round_minx)

        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '222', best: -1, average: -1, round: round_222)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '333', best: -1, average: -1, round: round_333)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '555', best: -1, average: -1, round: round_555)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '444', best: -1, average: -1, round: round_444)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: 'pyram', best: -1, average: -1, round: round_pyram)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: 'minx', best: -1, average: -1, round: round_minx)
      end

      it 'smoketest - succeeds when all qualifications are met' do
        registration_request = build(
          :registration_request,
          events: %w[222 333oh 333 555 444 pyram minx],
          user_id: user_with_results.id,
          competition_id: comp_with_qualifications.id,
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
        end.not_to raise_error
      end

      it 'smoketest - all qualifications unmet' do
        registration_request = build(
          :registration_request,
          events: %w[222 333oh 333 555 444 pyram minx],
          user_id: default_user.id,
          competition_id: enforced_hard_qualifications.id,
        )

        expect do
          Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), enforced_hard_qualifications)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.data.sort).to eq(%w[333 222 pyram minx 555 444].sort)
        end
      end

      RSpec.shared_examples 'succeed: qualification not enforced' do |event_ids|
        it "user with not good enough results: can register given #{event_ids}" do
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: unenforced_hard_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), unenforced_hard_qualifications)
          end.not_to raise_error
        end

        it "user with no results: can register given #{event_ids}" do
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_without_results.id,
            competition_id: unenforced_hard_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), unenforced_hard_qualifications)
          end.not_to raise_error
        end

        it "user with good enough results: can register given #{event_ids}" do
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: unenforced_easy_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), unenforced_easy_qualifications)
          end.not_to raise_error
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
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.not_to raise_error
        end

        it "future qualification date: #{description}" do
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: easy_future_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), easy_future_qualifications)
          end.not_to raise_error
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
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_with_results.id,
            competition_id: past_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), past_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is nil" do
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: user_without_results.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is DNF" do
          registration_request = build(
            :registration_request,
            events: event_ids,
            user_id: dnfs_only.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
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
          slow_single = create(:user, :wca_id)
          round = create(:round, event_id: "333", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_single.person, event_id: '333', best: 4000, average: 5000, round: round)

          registration_request = build(
            :registration_request,
            events: ['333'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 333 equal to attemptResult-single' do
          slow_single = create(:user, :wca_id)
          round = create(:round, event_id: "333", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_single.person, event_id: '333', best: 1000, average: 1500, round: round)

          registration_request = build(
            :registration_request,
            events: ['333'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 555 slower than attemptResult-average' do
          slow_single = create(:user, :wca_id)
          round = create(:round, event_id: "555", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_single.person, event_id: '555', best: 1000, average: 6001, round: round)

          registration_request = build(
            :registration_request,
            events: ['555'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end

        it 'cant register when 555 equal to attemptResult-average' do
          slow_single = create(:user, :wca_id)
          round = create(:round, event_id: "555", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_single.person, event_id: '555', best: 1000, average: 6000, round: round)

          registration_request = build(
            :registration_request,
            events: ['555'],
            user_id: slow_single.id,
            competition_id: comp_with_qualifications.id,
          )

          expect do
            Registrations::RegistrationChecker.create_registration_allowed!(registration_request, User.find(registration_request['user_id']), comp_with_qualifications)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end
      end
    end
  end

  describe '#update' do
    let(:default_registration) { create(:registration, competition: default_competition) }

    describe '#update_registration_allowed!' do
      it 'does not alter the base registration during checking' do
        update_request = build(
          :update_request,
          competition_id: default_registration.competition.id,
          user_id: default_registration.user_id,
          competing: { 'event_ids' => ['333'] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.not_to raise_error

        # We never actually fired the update, we just checked whether it _would_ be permissible to do so
        expect(default_registration.reload.event_ids).to eq(%w[333 333oh])
      end
    end

    describe '#update_registration_allowed!.validate_comment!' do
      it 'user can change comment' do
        update_request = build(
          :update_request,
          competition_id: default_registration.competition_id,
          user_id: default_registration.user_id,
          competing: { 'comment' => 'new comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'user cant exceed comment length' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
          than 240 characterscomment longer than 240 characters'

        update_request = build(
          :update_request,
          competition_id: default_registration.competition_id,
          user_id: default_registration.user_id,
          competing: { 'comment' => long_comment },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end

      it 'user can match comment length' do
        at_character_limit = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than' \
                             '240 characterscomment longer longer than 240 12345'

        update_request = build(
          :update_request,
          competition_id: default_registration.competition_id,
          user_id: default_registration.user_id,
          competing: { 'comment' => at_character_limit },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'comment can be blank' do
        update_request = build(
          :update_request,
          competition_id: default_registration.competition_id,
          user_id: default_registration.user_id,
          competing: { 'comment' => '' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'cant set comment to blank if required' do
        comment_required = create(:competition, :editable_registrations, :registration_closed, force_comment_in_registration: true)
        registration = create(:registration, competition: comment_required, comments: 'test')

        update_request = build(
          :update_request,
          competition_id: registration.competition_id,
          user_id: registration.user_id,
          competing: { 'comment' => '' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING)
        end
      end

      it 'mandatory comment: updates without comments are allowed as long as a comment already exists in the registration' do
        comment_required = create(:competition, :editable_registrations, :registration_closed, force_comment_in_registration: true)
        registration = create(:registration, competition: comment_required, comments: 'test')

        update_request = build(
          :update_request,
          competition_id: registration.competition_id,
          user_id: registration.user_id,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end

      it 'oranizer can change registration state when comment is mandatory' do
        comment_required = create(
          :competition, :editable_registrations, :registration_closed, :with_organizer, force_comment_in_registration: true
        )
        registration = create(:registration, competition: comment_required, comments: 'test')

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: comment_required.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end

      it 'organizer can change user comment' do
        registration = create(:registration, competition: default_competition, comments: 'test')

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'comment' => 'heres a random different comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end

      it 'organizer cant exceed comment length' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
          than 240 characterscomment longer than 240 characters'

        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'comment' => long_comment },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end
    end

    describe '#update_registration_allowed!.validate_organizer_fields!' do
      it 'organizer can add admin_comment' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'admin_comment' => 'this is an admin comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'organizer can change admin_comment' do
        registration = create(
          :registration, user_id: default_user.id, competition_id: default_competition.id, administrative_notes: 'admin comment'
        )

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'admin_comment' => 'this is an admin comment' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end
    end

    describe '#update_registration_allowed!.validate_admin_comment!' do
      it 'admin comment cant exceed 240 characters' do
        long_comment = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer
        than 240 characterscomment longer than 240 characters'

        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'admin_comment' => long_comment },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::USER_COMMENT_TOO_LONG)
        end
      end

      it 'admin comment can match 240 characters' do
        at_character_limit = 'comment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than 240 characterscomment longer than' \
                             '240 characterscomment longer longer than 240 12345'

        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'admin_comment' => at_character_limit },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end
    end

    describe '#update_registration_allowed!.validate_guests!' do
      it 'user can change number of guests' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          guests: 4,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'guests cant exceed guest limit' do
        competition = create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = create(:registration, competition: competition, user: default_user)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          guests: 14,
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'guests can match guest limit' do
        competition = create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = create(:registration, competition: competition, user: default_user)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          guests: 10,
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration)
        end.not_to raise_error
      end

      it 'guests can be zero' do
        competition = create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = create(:registration, competition: competition, user: default_user)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          guests: 0,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end

      it 'guests cant be negative' do
        competition = create(:competition, :with_guest_limit, :editable_registrations, :registration_closed)
        registration = create(:registration, competition: competition, user: default_user)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          guests: -1,
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'guests can be high if guest limit not set' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          guests: 99,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'guests cant be unreasonably high when no limit is set' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          guests: 100,
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::UNREASONABLE_GUEST_COUNT)
        end
      end

      it 'organizer can change number of guests' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          guests: 5,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'organizer can change guests after registration change deadline' do
        competition = create(:competition, :event_edit_passed, :with_organizer)
        registration = create(:registration, competition: competition)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: competition.organizers.first.id,
          guests: 5,
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end
    end

    describe '#update_registration_allowed!.validate_update_status!' do
      context 'competitor_can_cancel: not_accepted' do
        let(:accepted_cant_cancel) do
          create(
            :competition, :registration_closed, :editable_registrations, :with_organizer, competitor_can_cancel: :not_accepted
          )
        end

        it 'lets non-accepted user cancel' do
          not_accepted_reg = create(:registration, competition: accepted_cant_cancel)

          update_request = build(
            :update_request,
            user_id: not_accepted_reg.user_id,
            competition_id: not_accepted_reg.competition_id,
            competing: { 'status' => 'cancelled' },
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, not_accepted_reg) }
            .not_to raise_error
        end

        it 'lets organizer cancel accepted registration' do
          not_accepted_reg = create(:registration, competition: accepted_cant_cancel)

          update_request = build(
            :update_request,
            user_id: not_accepted_reg.user_id,
            competition_id: not_accepted_reg.competition_id,
            competing: { 'status' => 'cancelled' },
            submitted_by: not_accepted_reg.competition.organizers.first.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, not_accepted_reg) }
            .not_to raise_error
        end
      end

      context 'competitor_can_cancel: restrict_paid' do
        let(:paid_cant_cancel) do
          create(
            :competition, :registration_closed, :editable_registrations, :with_organizer, competitor_can_cancel: :unpaid
          )
        end

        it 'lets user cancel unpaid registration' do
          not_paid_reg = create(:registration, competition: paid_cant_cancel)

          update_request = build(
            :update_request,
            user_id: not_paid_reg.user_id,
            competition_id: not_paid_reg.competition_id,
            competing: { 'status' => 'cancelled' },
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, not_paid_reg) }
            .not_to raise_error
        end

        it 'lets organizer cancel paid registration' do
          not_paid_reg = create(:registration, competition: paid_cant_cancel)

          update_request = build(
            :update_request,
            user_id: not_paid_reg.user_id,
            competition_id: not_paid_reg.competition_id,
            competing: { 'status' => 'cancelled' },
            submitted_by: not_paid_reg.competition.organizers.first.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, not_paid_reg) }
            .not_to raise_error
        end
      end

      it 'user cant submit an invalid status' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'status' => 'invalid_status' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'organizer cant submit an invalid status' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'status' => 'invalid_status' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'organizer can accept registrations when there is no competitor limit' do
        no_competitor_limit = create(:competition, :with_organizer)
        registration = create(:registration, competition: no_competitor_limit)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: no_competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end

      it 'organizer can edit accepted registration when competition is full' do
        competitor_limit = create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        create_list(:registration, 2, :accepted, competition: competitor_limit)
        registration = create(:registration, :accepted, competition: competitor_limit)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'comment' => 'test comment' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration)
        end.not_to raise_error
      end

      it 'only considers regstrations from current comp when calculating accepted registrations' do
        competitor_limit = create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = create(:registration, competition: competitor_limit)
        create_list(:registration, 2, :accepted, competition: competitor_limit)
        create_list(:registration, 10, :accepted)

        update_request = build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition_id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_reg)
        end.not_to raise_error
      end

      it 'only considers is_competing: true registrations' do
        competitor_limit = create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = create(:registration, competition: competitor_limit)
        create_list(:registration, 2, :accepted, competition: competitor_limit)
        create_list(:registration, 3, :non_competing, competition: competitor_limit)

        update_request = build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition_id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_reg)
        end.not_to raise_error
      end

      it 'organizer cant accept a user when registration list is exactly full' do
        competitor_limit = create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = create(:registration, competition: competitor_limit)
        create_list(:registration, 3, :accepted, competition: competitor_limit)

        update_request = build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition_id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_reg)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'organizer cant accept a user when registration list is over full' do
        competitor_limit = create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = create(:registration, competition: competitor_limit)
        create_list(:registration, 4, :accepted, :skip_validations, competition: competitor_limit)

        update_request = build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition_id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_reg)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'organizer can accept registrations up to the limit' do
        competitor_limit = create(:competition, :with_competitor_limit, :with_organizer, competitor_limit: 3)
        limited_reg = create(:registration, competition: competitor_limit)
        create_list(:registration, 2, :accepted, competition: competitor_limit)

        update_request = build(
          :update_request,
          user_id: limited_reg.user_id,
          competition_id: limited_reg.competition_id,
          submitted_by: competitor_limit.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_reg) }
          .not_to raise_error
      end

      it 'user can change state to deleted' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'status' => 'cancelled' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'user cant change events when deleting' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'status' => 'cancelled', 'event_ids' => ['333'] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      it 'user can change state from cancelled to pending' do
        no_edits_comp = create(:competition, :registration_open)
        cancelled_reg = create(:registration, :cancelled, competition: no_edits_comp)

        update_request = build(
          :update_request,
          user_id: cancelled_reg.user_id,
          competition_id: cancelled_reg.competition_id,
          competing: { 'status' => 'pending' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, cancelled_reg) }
          .not_to raise_error
      end

      it 'organizer can cancel registration after registration ends' do
        editing_over = create(
          :competition, :registration_closed, :event_edit_passed, :with_organizer
        )
        registration = create(:registration, competition: editing_over)

        update_request = build(
          :update_request,
          user_id: registration.user_id,
          competition_id: registration.competition_id,
          submitted_by: editing_over.organizers.first.id,
          competing: { 'status' => 'cancelled' },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
          .not_to raise_error
      end

      RSpec.shared_examples 'valid organizer status updates' do |initial_status, new_status|
        it "organizer can change 'status' => #{initial_status} to: #{new_status} before close" do
          registration = create(:registration, competing_status: initial_status.to_s, competition: default_competition)

          update_request = build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition_id,
            competing: { 'status' => new_status },
            submitted_by: default_competition.organizers.first.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
            .not_to raise_error
        end

        it "site admin can change 'status' => #{initial_status} to: #{new_status} before close" do
          admin = create(:admin)
          registration = create(:registration, initial_status, competition: default_competition)

          update_request = build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition_id,
            competing: { 'status' => new_status },
            submitted_by: admin.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
            .not_to raise_error
        end

        it "after edit deadline/reg close, organizer can change 'status' => #{initial_status} to: #{new_status}" do
          competition = create(:competition, :with_organizer, :event_edit_passed)
          registration = create(:registration, initial_status, competition: competition)

          update_request = build(
            :update_request,
            user_id: registration.user_id,
            competition_id: registration.competition_id,
            competing: { 'status' => new_status },
            submitted_by: competition.organizers.first.id,
          )

          expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration) }
            .not_to raise_error
        end
      end

      [
        { initial_status: :pending, new_status: 'accepted' },
        { initial_status: :pending, new_status: 'waiting_list' },
        { initial_status: :pending, new_status: 'cancelled' },
        { initial_status: :pending, new_status: 'pending' },
        { initial_status: :pending, new_status: 'rejected' },
        { initial_status: :waiting_list, new_status: 'pending' },
        { initial_status: :waiting_list, new_status: 'cancelled' },
        { initial_status: :waiting_list, new_status: 'waiting_list' },
        { initial_status: :waiting_list, new_status: 'accepted' },
        { initial_status: :waiting_list, new_status: 'rejected' },
        { initial_status: :accepted, new_status: 'pending' },
        { initial_status: :accepted, new_status: 'cancelled' },
        { initial_status: :accepted, new_status: 'waiting_list' },
        { initial_status: :accepted, new_status: 'accepted' },
        { initial_status: :accepted, new_status: 'rejected' },
        { initial_status: :cancelled, new_status: 'accepted' },
        { initial_status: :cancelled, new_status: 'pending' },
        { initial_status: :cancelled, new_status: 'waiting_list' },
        { initial_status: :cancelled, new_status: 'rejected' },
        { initial_status: :cancelled, new_status: 'cancelled' },
        { initial_status: :rejected, new_status: 'accepted' },
        { initial_status: :rejected, new_status: 'pending' },
        { initial_status: :rejected, new_status: 'waiting_list' },
        { initial_status: :rejected, new_status: 'cancelled' },
      ].each do |params|
        it_behaves_like 'valid organizer status updates', params[:initial_status], params[:new_status]
      end
    end

    describe '#update_registration_allowed!.validate_update_events!' do
      let(:events_limit) { create(:competition, :with_organizer, :editable_registrations, :registration_open, :with_event_limit) }
      let(:limited_registration) { create(:registration, competition: events_limit) }

      it 'user can add events' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'event_ids' => %w[333 444 555 minx] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'user can remove events' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'event_ids' => ['333'] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'user can remove all old events and register for new ones' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'event_ids' => %w[pyram minx] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'events list cant be blank' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'event_ids' => [] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'events must be held at the competition' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'event_ids' => %w[333 333fm] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'events must exist' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          competing: { 'event_ids' => %w[888 333] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'organizer can change a users events' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'event_ids' => %w[333 555] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration) }
          .not_to raise_error
      end

      it 'organizer cant change users events to events not held at competition' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'event_ids' => %w[333 333fm] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'competitor can update registration with events up to the events_per_registration_limit limit' do
        update_request = build(
          :update_request,
          user_id: limited_registration.user_id,
          competition_id: limited_registration.competition_id,
          competing: { 'event_ids' => %w[333 333oh 555 pyram minx] },
        )

        expect { Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_registration) }
          .not_to raise_error
      end

      it 'competitor cant update registration to more events than the events_per_registration_limit' do
        update_request = build(
          :update_request,
          user_id: limited_registration.user_id,
          competition_id: limited_registration.competition_id,
          competing: { 'event_ids' => %w[333 333oh 555 pyram minx 222] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, limited_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end

      it 'organizer cant update their registration with more events than the events_per_registration_limit' do
        organizer_reg = create(:registration, user: events_limit.organizers.first, competition: events_limit)

        update_request = build(
          :update_request,
          user_id: organizer_reg.user_id,
          competition_id: organizer_reg.competition_id,
          competing: { 'event_ids' => %w[333 333oh 555 pyram minx 222] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, organizer_reg)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_EVENT_SELECTION)
        end
      end
    end

    describe '#update_registration_allowed!.validate_waiting_list_position!' do
      let(:waiting_list) { default_competition.waiting_list }
      let!(:waitlisted_registration) { create(:registration, :waiting_list, competition: default_competition) }

      before do
        create_list(:registration, 4, :waiting_list, competition: default_competition)
      end

      it 'waiting list position can be updated' do
        update_request = build(
          :update_request,
          user_id: waitlisted_registration.user_id,
          competition_id: waitlisted_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 3 },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, waitlisted_registration)
        end.not_to raise_error
      end

      it 'must be an integer, not string' do
        update_request = build(
          :update_request,
          user_id: waitlisted_registration.user_id,
          competition_id: waitlisted_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 'b' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, waitlisted_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'can be an integer given as a string' do
        update_request = build(
          :update_request,
          user_id: waitlisted_registration.user_id,
          competition_id: waitlisted_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => '1' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, waitlisted_registration)
        end.not_to raise_error
      end

      it 'must be an integer, not float' do
        update_request = build(
          :update_request,
          user_id: waitlisted_registration.user_id,
          competition_id: waitlisted_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 2.0 },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, waitlisted_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'cannot move to less than position 1' do
        update_request = build(
          :update_request,
          user_id: waitlisted_registration.user_id,
          competition_id: waitlisted_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 0 },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, waitlisted_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'cannot move to greater than the number of items in the waiting list' do
        update_request = build(
          :update_request,
          user_id: waitlisted_registration.user_id,
          competition_id: waitlisted_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 6 },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, waitlisted_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION)
        end
      end

      it 'registration must be on the waiting list' do
        update_request = build(
          :update_request,
          user_id: default_registration.user_id,
          competition_id: default_registration.competition_id,
          submitted_by: default_competition.organizers.first.id,
          competing: { 'waiting_list_position' => 1 },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, default_registration)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.status).to eq(:unprocessable_entity)
          expect(error.error).to eq(Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end
    end

    describe '#update_registration_allowed!.validate_qualifications!' do
      let(:past_competition) { create(:competition, :past) }

      let(:unenforced_easy_qualifications) { create(:competition, :registration_open, :unenforced_easy_qualifications, :editable_registrations) }
      let(:unenforced_hard_qualifications) { create(:competition, :registration_open, :unenforced_hard_qualifications, :editable_registrations) }

      let(:easy_qualifications) { create(:competition, :registration_open, :enforces_easy_qualifications, :editable_registrations) }
      let(:hard_qualifications) { create(:competition, :registration_open, :enforces_hard_qualifications, :editable_registrations) }
      let(:easy_future_qualifications) { create(:competition, :registration_open, :easy_future_qualifications, :editable_registrations, :with_organizer) }
      let(:past_qualifications) { create(:competition, :registration_open, :enforces_past_qualifications, :editable_registrations) }

      let(:user_with_results) { create(:user, :wca_id) }
      let(:user_without_results) { create(:user, :wca_id) }
      let(:dnfs_only) { create(:user, :wca_id) }

      let(:easy_registration_with_results_reg) do
        create(
          :registration, :skip_validations, user: user_with_results, competition: easy_qualifications
        )
      end

      before do
        round_222 = create(:round, competition: past_competition, event_id: "222")
        round_333 = create(:round, competition: past_competition, event_id: "333")
        round_555 = create(:round, competition: past_competition, event_id: "555")
        round_444 = create(:round, competition: past_competition, event_id: "444")
        round_pyram = create(:round, competition: past_competition, event_id: "pyram")
        round_minx = create(:round, competition: past_competition, event_id: "minx")
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '222', best: 400, average: 500, round: round_222)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '333', best: 410, average: 510, round: round_333)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '555', best: 420, average: 520, round: round_555)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: '444', best: 430, average: 530, round: round_444)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: 'pyram', best: 440, average: 540, round: round_pyram)
        create(:result, competition: past_competition, person: user_with_results.person, event_id: 'minx', best: 450, average: 550, round: round_minx)

        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '222', best: -1, average: -1, round: round_222)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '333', best: -1, average: -1, round: round_333)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '555', best: -1, average: -1, round: round_555)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: '444', best: -1, average: -1, round: round_444)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: 'pyram', best: -1, average: -1, round: round_pyram)
        create(:result, competition: past_competition, person: dnfs_only.person, event_id: 'minx', best: -1, average: -1, round: round_minx)
      end

      it 'smoketest - succeeds when all qualifications are met' do
        update_request = build(
          :update_request,
          user_id: easy_registration_with_results_reg.user_id,
          competition_id: easy_registration_with_results_reg.competition_id,
          competing: { 'event_ids' => %w[222 333 555 444 pyram minx] },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, easy_registration_with_results_reg)
        end.not_to raise_error
      end

      RSpec.shared_examples 'update succeed: qualification not enforced' do |event_ids|
        let(:reg_with_results_for_unenforced_hard_quali) do
          create(
            :registration, :skip_validations, user: user_with_results, competition: unenforced_hard_qualifications
          )
        end

        let(:reg_with_no_results_for_unenforced_hard_quali) do
          create(
            :registration, :skip_validations, user: user_without_results, competition: unenforced_hard_qualifications
          )
        end

        let(:reg_with_results_for_unenforced_easy_quali) do
          create(
            :registration, :skip_validations, user: user_with_results, competition: unenforced_easy_qualifications
          )
        end

        it "user with not good enough results: can register given #{event_ids}" do
          update_request = build(
            :update_request,
            user_id: reg_with_results_for_unenforced_hard_quali.user_id,
            competition_id: reg_with_results_for_unenforced_hard_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, reg_with_results_for_unenforced_hard_quali)
          end.not_to raise_error
        end

        it "user with no results: can register given #{event_ids}" do
          update_request = build(
            :update_request,
            user_id: reg_with_no_results_for_unenforced_hard_quali.user_id,
            competition_id: reg_with_no_results_for_unenforced_hard_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, reg_with_no_results_for_unenforced_hard_quali)
          end.not_to raise_error
        end

        it "user with good enough results: can register given #{event_ids}" do
          update_request = build(
            :update_request,
            user_id: reg_with_results_for_unenforced_easy_quali.user_id,
            competition_id: reg_with_results_for_unenforced_easy_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, reg_with_results_for_unenforced_easy_quali)
          end.not_to raise_error
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
        let(:reg_with_results_easy_quali) do
          create(
            :registration, :skip_validations, user: user_with_results, competition: easy_qualifications
          )
        end

        let(:reg_with_results_future_easy_quali) do
          create(
            :registration, :skip_validations, user: user_with_results, competition: easy_future_qualifications
          )
        end

        it description.to_s do
          update_request = build(
            :update_request,
            user_id: reg_with_results_easy_quali.user_id,
            competition_id: reg_with_results_easy_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, reg_with_results_easy_quali)
          end.not_to raise_error
        end

        it "future qualification date: #{description}" do
          update_request = build(
            :update_request,
            user_id: reg_with_results_future_easy_quali.user_id,
            competition_id: reg_with_results_future_easy_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, reg_with_results_future_easy_quali)
          end.not_to raise_error
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
        let(:user_with_results_registering_for_past) do
          create(
            :registration, :skip_validations, user: user_with_results, competition: past_qualifications
          )
        end

        let(:user_without_results_easy_quali) do
          create(
            :registration, :skip_validations, user: user_without_results, competition: easy_qualifications
          )
        end

        let(:user_with_dnfs_easy_quali) do
          create(
            :registration, :skip_validations, user: dnfs_only, competition: easy_qualifications
          )
        end

        it "cant register for #{event_ids} if result is achieved too late" do
          update_request = build(
            :update_request,
            user_id: user_with_results_registering_for_past.user_id,
            competition_id: user_with_results_registering_for_past.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, user_with_results_registering_for_past)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is nil" do
          update_request = build(
            :update_request,
            user_id: user_without_results_easy_quali.user_id,
            competition_id: user_without_results_easy_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, user_without_results_easy_quali)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(event_ids)
          end
        end

        it "cant register for #{event_ids} if result is DNF" do
          update_request = build(
            :update_request,
            user_id: user_with_dnfs_easy_quali.user_id,
            competition_id: user_with_dnfs_easy_quali.competition_id,
            competing: { 'event_ids' => event_ids },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, user_with_dnfs_easy_quali)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
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
          slow_single = create(:user, :wca_id)
          round = create(:round, event_id: "333", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_single.person, event_id: '333', best: 1001, average: 5000, round: round)
          slow_single_reg = create(:registration, :skip_validations, user: slow_single, competition: easy_qualifications)

          update_request = build(
            :update_request,
            user_id: slow_single_reg.user_id,
            competition_id: slow_single_reg.competition_id,
            competing: { 'event_ids' => ['333'] },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, slow_single_reg)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 333 equal to attemptResult-single' do
          slow_single = create(:user, :wca_id)
          round = create(:round, event_id: "333", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_single.person, event_id: '333', best: 1000, average: 1500, round: round)
          slow_single_reg = create(:registration, :skip_validations, user: slow_single, competition: easy_qualifications)

          update_request = build(
            :update_request,
            user_id: slow_single_reg.user_id,
            competition_id: slow_single_reg.competition_id,
            competing: { 'event_ids' => ['333'] },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, slow_single_reg)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['333'])
          end
        end

        it 'cant register when 555 slower than attemptResult-average' do
          slow_average = create(:user, :wca_id)
          round = create(:round, event_id: "555", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_average.person, event_id: '555', best: 1000, average: 6001, round: round)
          slow_average_reg = create(:registration, :skip_validations, user: slow_average, competition: easy_qualifications)

          update_request = build(
            :update_request,
            user_id: slow_average_reg.user_id,
            competition_id: slow_average_reg.competition_id,
            competing: { 'event_ids' => ['555'] },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, slow_average_reg)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end

        it 'cant register when 555 equal to attemptResult-average' do
          slow_average = create(:user, :wca_id)
          round = create(:round, event_id: "555", competition: past_competition, number: 2)
          create(:result, competition: past_competition, person: slow_average.person, event_id: '555', best: 1000, average: 6000, round: round)
          slow_average_reg = create(:registration, :skip_validations, user: slow_average, competition: easy_qualifications)

          update_request = build(
            :update_request,
            user_id: slow_average_reg.user_id,
            competition_id: slow_average_reg.competition_id,
            competing: { 'event_ids' => ['555'] },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, slow_average_reg)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::QUALIFICATION_NOT_MET)
            expect(error.status).to eq(:unprocessable_entity)
            expect(error.data).to eq(['555'])
          end
        end
      end
    end

    describe '#update_registration_allowed!.updating series registrations' do
      let(:registration_a) { create(:registration, :accepted) }

      let(:series) { create(:competition_series) }
      let(:competition_a) { registration_a.competition }
      let(:competition_b) do
        create(
          :competition, :registration_open, :editable_registrations, :with_organizer, competition_series: series, series_base: competition_a
        )
      end

      let(:registration_b) { create(:registration, :cancelled, competition: competition_b, user_id: registration_a.user.id) }

      before do
        competition_a.update!(competition_series: series)
      end

      it 'organizer cant set status to accepted if attendee is accepted for another series comp' do
        update_request = build(
          :update_request,
          user_id: registration_b.user.id,
          competition_id: competition_b.id,
          submitted_by: competition_b.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration_b)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'organizer can update admin comment in attendees non-accepted series comp registration' do
        update_request = build(
          :update_request,
          user_id: registration_b.user_id,
          competition_id: registration_b.competition_id,
          submitted_by: competition_b.organizers.first.id,
          competing: { 'admin_comment' => 'why they were cancelled' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, registration_b)
        end.not_to raise_error
      end
    end

    describe '#update_registration_allowed!.reserved newcomer spots' do
      let(:newcomer_month_comp) { create(:competition, :newcomer_month) }
      let(:non_newcomer_reg) { create(:registration, competition: newcomer_month_comp) }
      let(:newcomer_month_eligible_reg) { create(:registration, :newcomer_month_eligible, competition: newcomer_month_comp) }
      let(:newcomer_reg) { create(:registration, :newcomer, competition: newcomer_month_comp) }

      before do
        stub_const("Competition::NEWCOMER_MONTH_ENABLED", true)
      end

      describe 'only newcomer spots remain' do
        before do
          create_list(:registration, 2, :accepted, competition: newcomer_month_comp)
        end

        it 'organizer cant accept non-newcomer if only reserved newcomer spots remain' do
          update_request = build(
            :update_request,
            user_id: non_newcomer_reg.user_id,
            competition_id: non_newcomer_reg.competition_id,
            submitted_by: newcomer_month_comp.organizers.first.id,
            competing: { 'status' => 'accepted' },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, non_newcomer_reg)
          end.to raise_error(WcaExceptions::RegistrationError) do |error|
            expect(error.error).to eq(Registrations::ErrorCodes::NO_UNRESERVED_SPOTS_REMAINING)
            expect(error.status).to eq(:unprocessable_entity)
          end
        end

        it 'organizer can accept newcomer' do
          update_request = build(
            :update_request,
            user_id: newcomer_reg.user_id,
            competition_id: newcomer_reg.competition_id,
            submitted_by: newcomer_month_comp.organizers.first.id,
            competing: { 'status' => 'accepted' },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, newcomer_reg)
          end.not_to raise_error
        end

        it 'organizer can accept user who started competing this year' do
          update_request = build(
            :update_request,
            user_id: newcomer_month_eligible_reg.user_id,
            competition_id: newcomer_month_eligible_reg.competition_id,
            submitted_by: newcomer_month_comp.organizers.first.id,
            competing: { 'status' => 'accepted' },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, newcomer_month_eligible_reg)
          end.not_to raise_error
        end
      end

      context 'reserved newcomer spots are full' do
        before do
          create_list(:registration, 2, :newcomer_month_eligible, :accepted, competition: newcomer_month_comp)
        end

        it 'organizer can still accept newcomers if all reserved newcomer spots are full' do
          update_request = build(
            :update_request,
            user_id: newcomer_reg.user_id,
            competition_id: newcomer_reg.competition_id,
            submitted_by: newcomer_month_comp.organizers.first.id,
            competing: { 'status' => 'accepted' },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, newcomer_reg)
          end.not_to raise_error
        end

        it 'organizer can still accept newcomer_month_eligibles if all reserved newcomer spots are full' do
          update_request = build(
            :update_request,
            user_id: newcomer_month_eligible_reg.user_id,
            competition_id: newcomer_month_eligible_reg.competition_id,
            submitted_by: newcomer_month_comp.organizers.first.id,
            competing: { 'status' => 'accepted' },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, newcomer_month_eligible_reg)
          end.not_to raise_error
        end

        it 'organizer can accept non-newcomer if all reserved newcomer spots are full' do
          update_request = build(
            :update_request,
            user_id: non_newcomer_reg.user_id,
            competition_id: non_newcomer_reg.competition_id,
            submitted_by: newcomer_month_comp.organizers.first.id,
            competing: { 'status' => 'accepted' },
          )

          expect do
            Registrations::RegistrationChecker.update_registration_allowed!(update_request, non_newcomer_reg)
          end.not_to raise_error
        end
      end

      it 'organizer cant accept newcomer if competition is full' do
        create_list(:registration, 4, :newcomer_month_eligible, :accepted, competition: newcomer_month_comp)

        update_request = build(
          :update_request,
          user_id: newcomer_reg.user_id,
          competition_id: newcomer_reg.competition_id,
          submitted_by: newcomer_month_comp.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, newcomer_reg)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end

      it 'takes newcomer registrations into account when calculating spots remaining' do
        create_list(:registration, 2, :accepted, competition: newcomer_month_comp)
        create(:registration, :accepted, :newcomer_month_eligible, competition: newcomer_month_comp)

        update_request = build(
          :update_request,
          user_id: non_newcomer_reg.user_id,
          competition_id: non_newcomer_reg.competition_id,
          submitted_by: newcomer_month_comp.organizers.first.id,
          competing: { 'status' => 'accepted' },
        )

        expect do
          Registrations::RegistrationChecker.update_registration_allowed!(update_request, non_newcomer_reg)
        end.to raise_error(WcaExceptions::RegistrationError) do |error|
          expect(error.error).to eq(Registrations::ErrorCodes::NO_UNRESERVED_SPOTS_REMAINING)
          expect(error.status).to eq(:unprocessable_entity)
        end
      end
    end
  end
end
