# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Registration do
  let(:registration) { FactoryBot.create :registration }

  it "defines a valid registration" do
    expect(registration).to be_valid
  end

  it "requires a competition_id" do
    registration.competition_id = nil
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["must exist"]
  end

  it "requires a valid competition_id" do
    registration.competition_id = "foobar"
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["must exist"]
  end

  it "allows no user on update" do
    registration.user_id = nil
    expect(registration).to be_valid
  end

  describe "on create" do
    let(:registration) { FactoryBot.build :registration }

    it "requires user on create" do
      expect(FactoryBot.build(:registration, user_id: nil)).to be_invalid_with_errors(user: ["can't be blank"])
    end

    it "requires user country" do
      user = FactoryBot.create(:user, country_iso2: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a region"])
    end

    it "requires user gender" do
      user = FactoryBot.create(:user, gender: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a gender"])
    end

    it "requires user dob" do
      user = FactoryBot.create(:user, dob: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a birthdate"])
    end

    it "requires user not banned" do
      user = FactoryBot.create(:user, :banned)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: [I18n.t('registrations.errors.banned_html').html_safe])
    end
  end

  it "doesn't invalidate existing registration when the competitor is banned" do
    user = FactoryBot.create(:user, :banned)
    registration.user = user
    expect(registration).to be_valid
  end

  it "allows deleting a registration of a banned competitor" do
    user = FactoryBot.create(:user, :banned)
    registration.user = user
    registration.save!
    registration.competing_status = Registrations::Helper::STATUS_CANCELLED
    expect(registration).to be_valid
  end

  it "doesn't allow undeleting a registration of a banned competitor" do
    user = FactoryBot.create(:user, :banned)
    registration.user = user
    registration.competing_status = Registrations::Helper::STATUS_CANCELLED
    registration.save!
    registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
    expect(registration).to be_invalid_with_errors(user_id: [I18n.t('registrations.errors.undelete_banned')])
  end

  it "requires at least one event" do
    registration.registration_competition_events = []
    expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.must_register')])
  end

  it "allows zero events for non competing staff" do
    registration.registration_competition_events = []
    registration.is_competing = false
    expect(registration).to be_valid
  end

  it "requires events be offered by competition" do
    registration.registration_competition_events.build(competition_event_id: 1234)
    expect(registration).to be_invalid_with_errors(
      "registration_competition_events.competition_event" => ["must exist"],
    )
  end

  it "handles a changing user" do
    registration.user.update_column(:name, "New Name")
    expect(registration.name).to eq "New Name"
  end

  context "upper guest limit enabled" do
    guest_limit = 2
    let(:competition) { FactoryBot.create :competition, :with_guest_limit, guests_per_registration_limit: guest_limit }

    before :each do
      registration.competition = competition
    end

    it "allows 0 guests" do
      registration.guests = 0
      expect(registration).to be_valid
    end

    it "allows guests less than guest limit" do
      registration.guests = 1
      expect(registration).to be_valid
    end

    it "allows guests equal to guest limit" do
      registration.guests = 2
      expect(registration).to be_valid
    end

    it "requires guests less than guest limit" do
      registration.guests = 3
      expect(registration).to be_invalid_with_errors(guests: ["must be less than or equal to 2"])
    end

    it "requires guests greater than 0" do
      registration.guests = -5
      expect(registration).to be_invalid_with_errors(guests: ["must be greater than or equal to 0"])
    end
  end

  context "upper guest limit not enabled" do
    it "allows guests greater than guest limit" do
      guest_limit = 1
      competition = FactoryBot.create :competition, guests_per_registration_limit: guest_limit, guest_entry_status: Competition.guest_entry_statuses['free']
      registration.competition = competition
      registration.guests = 1_000_000
      expect(registration.guests).to be > registration.guest_limit
      expect(registration).to be_valid
    end

    it "requires guests greater than 0" do
      registration.guests = -1
      expect(registration).to be_invalid_with_errors(guests: ["must be greater than or equal to 0"])
    end
  end

  context "number of events selected" do
    event_ids = ["222", "333", "444", "555", "666", "777"]
    event_limit = event_ids.length - 2

    context "with event limit" do
      let(:competition) { FactoryBot.create :competition, :with_event_limit, events_per_registration_limit: event_limit, event_ids: event_ids }

      it "blocks registrations when zero events are selected" do
        registration = FactoryBot.build(:registration, competition: competition, events: [])
        expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.must_register')])
      end

      it "allows registration when just one is event selected" do
        registration = FactoryBot.build(:registration, competition: competition, events: competition.events.first)
        expect(registration).to be_valid
      end

      it "allows registration when number of events selected is less than limit" do
        registration = FactoryBot.build(:registration, competition: competition, events: competition.events.first(event_limit - 1))
        expect(registration).to be_valid
      end

      it "allows registration when number of events selected is equal to limit" do
        registration = FactoryBot.build(:registration, competition: competition, events: competition.events.first(event_limit))
        expect(registration).to be_valid
      end

      it "blocks registration when number of events selected is greater than limit" do
        registration = FactoryBot.build(:registration, competition: competition, events: competition.events)
        expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.exceeds_event_limit', count: event_limit)])
      end
    end

    context "without event limit" do
      let(:competition) { FactoryBot.create :competition, event_ids: event_ids }

      it "blocks registrations when zero events are selected" do
        registration = FactoryBot.build(:registration, competition: competition, events: [])
        expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.must_register')])
      end

      it "allows registration when all events are selected" do
        registration = FactoryBot.build(:registration, competition: competition, events: competition.events)
        expect(registration).to be_valid
      end
    end
  end

  context "when the competition is part of a series" do
    let!(:series) { FactoryBot.create :competition_series, name: "Registration Test Series 2015" }

    let!(:partner_competition) { FactoryBot.create :competition, series_base: registration.competition, competition_series: series }
    let!(:partner_registration) { FactoryBot.create :registration, :pending, competition: partner_competition, user: registration.user }

    before { registration.competition.update!(competition_series: series) }

    it "does allow multiple pending registrations for one competitor" do
      expect(registration).to be_valid
      expect(partner_registration).to be_valid
    end

    context "and one registration is accepted" do
      before { registration.update!(competing_status: Registrations::Helper::STATUS_ACCEPTED) }

      it "does allow accepting when the other registration is pending" do
        expect(registration).to be_valid
        expect(partner_registration).to be_valid
      end

      it "does allow accepting when the other registration is deleted" do
        expect(registration).to be_valid

        partner_registration.competing_status = Registrations::Helper::STATUS_CANCELLED
        expect(partner_registration).to be_valid
      end

      it "doesn't allow accepting when the other registration is confirmed" do
        expect(registration).to be_valid

        partner_registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
        expect(partner_registration).to be_invalid_with_errors(competition_id: [I18n.t('registrations.errors.series_more_than_one_accepted')])
      end
    end
  end

  describe "qualification" do
    let!(:user) { FactoryBot.create(:user_with_wca_id) }
    let!(:previous_competition) {
      FactoryBot.create(
        :competition,
        start_date: '2021-02-01',
        end_date: '2021-02-01',
      )
    }
    let!(:result) {
      FactoryBot.create(
        :result,
        personId: user.wca_id,
        competitionId: previous_competition.id,
        eventId: '333',
        best: 1200,
        average: 1500,
      )
    }
    let!(:competition) {
      FactoryBot.create(
        :competition,
        event_ids: %w(333),
      )
    }
    let!(:competition_event) {
      CompetitionEvent.find_by(competition_id: competition.id, event_id: '333')
    }
    let!(:registration) {
      FactoryBot.create(
        :registration,
        competition: competition,
        user: user,
      )
    }

    it "allows unqualified registration when not required" do
      input = {
        'resultType' => 'average',
        'type' => 'attemptResult',
        'whenDate' => '2021-06-21',
        'level' => 1300,
      }
      competition_event.qualification = Qualification.load(input)
      competition_event.save!
      competition.allow_registration_without_qualification = true
      competition.save!
      registration.reload
      expect(registration).to be_valid
    end

    it "allows qualified registration" do
      input = {
        'resultType' => 'average',
        'type' => 'attemptResult',
        'whenDate' => '2021-06-21',
        'level' => 1600,
      }
      competition_event.qualification = Qualification.load(input)
      competition_event.save!
      competition.allow_registration_without_qualification = false
      competition.save!
      registration.reload
      expect(registration).to be_valid
    end

    it "doesn't allow unqualified registration" do
      input = {
        'resultType' => 'average',
        'type' => 'attemptResult',
        'whenDate' => '2021-06-21',
        'level' => 1000,
      }
      competition_event.qualification = Qualification.load(input)
      competition_event.save!
      competition.allow_registration_without_qualification = false
      competition.save!
      registration.reload
      expect(registration).to be_invalid_with_errors(registration_competition_events: ["You cannot register for events you are not qualified for."])
    end
  end

  describe '#accepted_and_paid_pending_count' do
    it 'returns count of registrations which are accepted and which are paid and pending' do
      accepted_registrations_count = described_class.accepted.count
      paid_pending_registrations_count = described_class.pending.with_payments.count

      total_count = accepted_registrations_count + paid_pending_registrations_count

      expect(described_class.accepted_and_paid_pending_count).to eq(total_count)
    end
  end

  describe '#to_wcif' do
    it 'deleted state returns deleted status' do
      registration = FactoryBot.create(:registration, :cancelled)

      expect(registration.cancelled?).to eq(true)
      expect(registration.to_wcif['status']).to eq('deleted')
    end

    it 'rejected state returns deleted status' do
      registration = FactoryBot.create(:registration, :rejected)

      expect(registration.rejected?).to eq(true)
      expect(registration.to_wcif['status']).to eq('deleted')
    end

    it 'accepted state returns accepted status' do
      registration = FactoryBot.create(:registration, :accepted)

      expect(registration.accepted?).to eq(true)
      expect(registration.to_wcif['status']).to eq('accepted')
    end

    it 'pending state returns pending status' do
      registration = FactoryBot.create(:registration, :pending)

      expect(registration.pending?).to eq(true)
      expect(registration.to_wcif['status']).to eq('pending')
    end

    it 'waitlisted state returns pending status' do
      registration = FactoryBot.create(:registration, :waiting_list)

      expect(registration.waitlisted?).to eq(true)
      expect(registration.to_wcif['status']).to eq('pending')
    end
  end

  describe '#process_update' do
    it 'updates multiple properties simultaneously' do
      registration.update_lanes!(
        {
          user_id: registration.user.id, guests: 3, competing: {
            admin_comment: 'updated admin comment', comment: 'user comment', status: 'accepted', event_ids: ['333', '555']
          }
        }.with_indifferent_access,
        registration.user,
      )

      registration.reload
      expect(registration.comments).to eq('user comment')
      expect(registration.administrative_notes).to eq('updated admin comment')
      expect(registration.guests).to eq(3)
      expect(registration.competing_status).to eq('accepted')
      expect(registration.event_ids).to eq(['333', '555'])
    end

    describe 'update statuses' do
      competing_status_updates = [
        { initial_status: Registrations::Helper::STATUS_PENDING, input_status: Registrations::Helper::STATUS_ACCEPTED },
        { initial_status: Registrations::Helper::STATUS_PENDING, input_status: Registrations::Helper::STATUS_CANCELLED },
        { initial_status: Registrations::Helper::STATUS_PENDING, input_status: Registrations::Helper::STATUS_WAITING_LIST },
        { initial_status: Registrations::Helper::STATUS_PENDING, input_status: Registrations::Helper::STATUS_PENDING },
        { initial_status: Registrations::Helper::STATUS_PENDING, input_status: Registrations::Helper::STATUS_REJECTED },
        { initial_status: Registrations::Helper::STATUS_ACCEPTED, input_status: Registrations::Helper::STATUS_CANCELLED },
        { initial_status: Registrations::Helper::STATUS_ACCEPTED, input_status: Registrations::Helper::STATUS_PENDING },
        { initial_status: Registrations::Helper::STATUS_ACCEPTED, input_status: Registrations::Helper::STATUS_WAITING_LIST },
        { initial_status: Registrations::Helper::STATUS_ACCEPTED, input_status: Registrations::Helper::STATUS_ACCEPTED },
        { initial_status: Registrations::Helper::STATUS_ACCEPTED, input_status: Registrations::Helper::STATUS_REJECTED },
        { initial_status: Registrations::Helper::STATUS_WAITING_LIST, input_status: Registrations::Helper::STATUS_CANCELLED },
        { initial_status: Registrations::Helper::STATUS_WAITING_LIST, input_status: Registrations::Helper::STATUS_PENDING },
        { initial_status: Registrations::Helper::STATUS_WAITING_LIST, input_status: Registrations::Helper::STATUS_WAITING_LIST },
        { initial_status: Registrations::Helper::STATUS_WAITING_LIST, input_status: Registrations::Helper::STATUS_ACCEPTED },
        { initial_status: Registrations::Helper::STATUS_WAITING_LIST, input_status: Registrations::Helper::STATUS_REJECTED },
        { initial_status: Registrations::Helper::STATUS_CANCELLED, input_status: Registrations::Helper::STATUS_CANCELLED },
        { initial_status: Registrations::Helper::STATUS_CANCELLED, input_status: Registrations::Helper::STATUS_PENDING },
        { initial_status: Registrations::Helper::STATUS_CANCELLED, input_status: Registrations::Helper::STATUS_WAITING_LIST },
        { initial_status: Registrations::Helper::STATUS_CANCELLED, input_status: Registrations::Helper::STATUS_ACCEPTED },
        { initial_status: Registrations::Helper::STATUS_CANCELLED, input_status: Registrations::Helper::STATUS_REJECTED },
        { initial_status: Registrations::Helper::STATUS_REJECTED, input_status: Registrations::Helper::STATUS_CANCELLED },
        { initial_status: Registrations::Helper::STATUS_REJECTED, input_status: Registrations::Helper::STATUS_PENDING },
        { initial_status: Registrations::Helper::STATUS_REJECTED, input_status: Registrations::Helper::STATUS_WAITING_LIST },
        { initial_status: Registrations::Helper::STATUS_REJECTED, input_status: Registrations::Helper::STATUS_ACCEPTED },
        { initial_status: Registrations::Helper::STATUS_REJECTED, input_status: Registrations::Helper::STATUS_REJECTED },
      ]

      it 'tests cover all possible status update combinations' do
        combined_updates = (competing_status_updates).flatten
        expect(combined_updates).to match_array(REGISTRATION_TRANSITIONS)
      end

      RSpec.shared_examples 'update competing status' do |initial_status, input_status|
        it "given #{input_status}, #{initial_status} updates as expected" do
          registration = FactoryBot.create(:registration, initial_status.to_sym)
          registration.update_lanes!({ user_id: registration.user.id, competing: { status: input_status } }.with_indifferent_access, registration.user)
          registration.reload
          expect(registration.competing_status).to eq(input_status)
        end
      end

      RSpec.shared_examples 'update competing status: deleted cases' do |initial_status, input_status|
        it "given #{input_status}, #{initial_status} updates as expected" do
          registration = FactoryBot.create(:registration, input_status.to_sym)
          registration.update_lanes!({ user_id: registration.user.id, competing: { status: input_status } }.with_indifferent_access, registration.user)
          expect(registration.competing_status).to eq(Registrations::Helper::STATUS_CANCELLED)
        end
      end

      competing_status_updates.each do |params|
        it_behaves_like 'update competing status', params[:initial_status], params[:input_status]
      end
    end

    it 'updates guests' do
      registration.update_lanes!({ user_id: registration.user.id, guests: 5 }, registration.user)
      registration.reload
      expect(registration.guests).to eq(5)
    end

    # TODO: Should we change "comments" db field to "competing_comments"?
    it 'updates competing comment' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { comment: 'test comment' } }.with_indifferent_access, registration.user)
      registration.reload
      expect(registration.comments).to eq('test comment')
    end

    it 'updates admin comment' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { admin_comment: 'test admin comment' } }.with_indifferent_access, registration.user)
      registration.reload
      expect(registration.administrative_notes).to eq('test admin comment')
    end

    it 'removes events' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { event_ids: ['333'] } }.with_indifferent_access, registration.user)
      registration.reload
      expect(registration.event_ids).to eq(['333'])
    end

    it 'adds events' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { event_ids: ['333', '444', '555'] } }.with_indifferent_access, registration.user)
      registration.reload
      expect(registration.event_ids).to eq(['333', '444', '555'])
    end

    describe 'update waiting list position' do
      let(:competition) { FactoryBot.create(:competition, :registration_open, :editable_registrations, :with_organizer) }
      let(:waiting_list) { competition.waiting_list }

      let!(:reg1) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
      let!(:reg2) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
      let!(:reg3) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
      let!(:reg4) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
      let!(:reg5) { FactoryBot.create(:registration, :waiting_list, competition: competition) }

      it 'adds to waiting list' do
        reg = FactoryBot.create(:registration, competition: competition)
        reg.update_lanes!({ user_id: reg.user.id, competing: { status: 'waiting_list' } }.with_indifferent_access, reg.user)

        expect(reg.waiting_list_position).to eq(6)
      end

      it 'removes from waiting list' do
        reg4.update_lanes!({ user_id: reg4.user.id, competing: { status: 'pending' } }.with_indifferent_access, reg4.user)

        expect(reg4.waiting_list_position).to eq(nil)
        expect(waiting_list.entries.count).to eq(4)
      end

      it 'moves backwards in waiting list' do
        reg2.update_lanes!({ user_id: reg2.user.id, competing: { waiting_list_position: 5 } }.with_indifferent_access, reg2.user)

        expect(reg1.waiting_list_position).to eq(1)
        expect(reg2.waiting_list_position).to eq(5)
        expect(reg3.waiting_list_position).to eq(2)
        expect(reg4.waiting_list_position).to eq(3)
        expect(reg5.waiting_list_position).to eq(4)

        expect(waiting_list.entries.count).to eq(5)
      end

      it 'moves forwards in waiting list' do
        reg5.update_lanes!({ user_id: reg5.user.id, competing: { waiting_list_position: 1 } }.with_indifferent_access, reg5.user)

        expect(reg1.waiting_list_position).to eq(2)
        expect(reg2.waiting_list_position).to eq(3)
        expect(reg3.waiting_list_position).to eq(4)
        expect(reg4.waiting_list_position).to eq(5)
        expect(reg5.waiting_list_position).to eq(1)

        expect(waiting_list.entries.count).to eq(5)
      end
    end
  end

  describe '#auto_accept' do
    let(:auto_accept_comp) { FactoryBot.create(:competition, :auto_accept, :registration_open) }
    let!(:reg) { FactoryBot.create(:registration, competition: auto_accept_comp) }

    before do
      allow(Rails.logger).to receive(:error)
    end

    it 'auto accepts a competitor who pays for their pending registration' do
      expect(reg.competing_status).to eq('pending')

      FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

      reg.auto_accept
      expect(reg.reload.competing_status).to eq('accepted')
    end

    it 'auto accepts a competitor who included a donation in their payment' do
      expect(reg.competing_status).to eq('pending')

      FactoryBot.create(:registration_payment, :skip_create_hook, :with_donation, registration: reg, competition: auto_accept_comp)

      reg.auto_accept
      expect(reg.reload.competing_status).to eq('accepted')
    end

    it 'doesnt auto accept a competitor who gets refunded' do
      expect(reg.competing_status).to eq('pending')

      FactoryBot.create(:registration_payment, :refund, :skip_create_hook, registration: reg, competition: auto_accept_comp)

      reg.auto_accept
      expect(reg.reload.competing_status).to eq('pending')
      expect(Rails.logger).to have_received(:error).with('Competitor still has outstanding registration fees')
    end

    it 'accepts the last competitor on the auto-accept disable threshold' do
      auto_accept_comp.auto_accept_disable_threshold = 5
      FactoryBot.create_list(:registration, 4, :accepted, competition: auto_accept_comp)

      # Add some non-accepted registrations to make sure we're checking accepted registrations only
      FactoryBot.create_list(:registration, 5, competition: auto_accept_comp)
      expect(reg.competing_status).to eq('pending')

      FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

      reg.auto_accept
      expect(reg.reload.competing_status).to eq('accepted')
    end

    it 'can auto-accept the first user on the waiting list' do
      waiting_list_reg = FactoryBot.create(:registration, :waiting_list, competition: auto_accept_comp)

      FactoryBot.create(:registration_payment, :skip_create_hook, registration: waiting_list_reg, competition: auto_accept_comp)

      waiting_list_reg.auto_accept
      expect(waiting_list_reg.reload.competing_status).to eq('accepted')
    end

    context 'auto-accept isnt triggered' do
      it 'if a waitlisted registration is not first in the waiting list' do
        FactoryBot.create_list(:registration, 3, :waiting_list, competition: auto_accept_comp)
        waiting_list_reg = FactoryBot.create(:registration, :waiting_list, competition: auto_accept_comp)
        expect(waiting_list_reg.waiting_list_position).to eq(4)

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        waiting_list_reg.auto_accept
        expect(waiting_list_reg.reload.competing_status).to eq('waiting_list')
        expect(Rails.logger).to have_received(:error).with('Can only auto-accept pending registrations or first position on waiting list')
      end

      it 'if status is cancelled' do
        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.update(competing_status: 'cancelled')

        reg.auto_accept
        expect(reg.reload.competing_status).to eq('cancelled')
        expect(Rails.logger).to have_received(:error).with('Can only auto-accept pending registrations or first position on waiting list')
      end

      it 'if status is rejected' do
        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
        reg.update(competing_status: 'rejected')

        reg.auto_accept
        expect(reg.reload.competing_status).to eq('rejected')
        expect(Rails.logger).to have_received(:error).with('Can only auto-accept pending registrations or first position on waiting list')
      end

      it 'if status is accepted' do
        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
        reg.update(competing_status: 'accepted')

        reg.auto_accept
        expect(Rails.logger).to have_received(:error).with('Can only auto-accept pending registrations or first position on waiting list')
      end

      it 'if status is waiting_list and position isnt first' do
        FactoryBot.create(:registration, :waiting_list, competition: auto_accept_comp)
        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
        reg.update(competing_status: 'waiting_list')
        auto_accept_comp.waiting_list.add(reg.id)

        reg.auto_accept
        expect(reg.reload.competing_status).to eq('waiting_list')
        expect(Rails.logger).to have_received(:error).with('Can only auto-accept pending registrations or first position on waiting list')
      end

      it 'before registration has opened' do
        unopened_comp = FactoryBot.create(:competition, :auto_accept, :registration_not_opened)
        unopened_reg = FactoryBot.create(:registration, competition: unopened_comp)

        expect(unopened_reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: unopened_reg, competition: unopened_comp)

        unopened_reg.auto_accept
        expect(unopened_reg.reload.competing_status).to eq('pending')
        expect(Rails.logger).to have_received(:error).with('Cant auto-accept while registration is not open')
      end

      it 'after registration has closed' do
        closed_comp = FactoryBot.create(:competition, :auto_accept)
        closed_reg = FactoryBot.create(:registration, competition: closed_comp)

        expect(closed_reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: closed_reg, competition: closed_comp)

        closed_reg.auto_accept
        expect(closed_reg.reload.competing_status).to eq('pending')
        expect(Rails.logger).to have_received(:error).with('Cant auto-accept while registration is not open')
      end

      it 'unless auto-accept is enabled' do
        no_auto_accept = FactoryBot.create(:competition, :registration_open)
        no_auto_reg = FactoryBot.create(:registration, competition: no_auto_accept)

        expect(no_auto_reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: no_auto_reg, competition: no_auto_accept)

        no_auto_reg.auto_accept
        expect(no_auto_reg.reload.competing_status).to eq('pending')
        expect(Rails.logger).to have_received(:error).with('Auto-accept is not enabled for this competition.')
      end

      it 'when accepted registrations match the auto-accept disable threshold' do
        auto_accept_comp.auto_accept_disable_threshold = 5
        FactoryBot.create_list(:registration, 5, :accepted, competition: auto_accept_comp)
        expect(reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.auto_accept
        expect(reg.reload.competing_status).to eq('pending')
        expect(Rails.logger).to have_received(:error).with(
          'Competition has reached auto_accept_disable_threshold of 5 registrations',
        )
      end

      it 'when accepted registrations exceed the auto-accept disable threshold' do
        auto_accept_comp.auto_accept_disable_threshold = 5
        FactoryBot.create_list(:registration, 6, :accepted, competition: auto_accept_comp)
        expect(reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.auto_accept
        expect(reg.reload.competing_status).to eq('pending')
        expect(Rails.logger).to have_received(:error).with(
          'Competition has reached auto_accept_disable_threshold of 5 registrations',
        )
      end
    end

    context 'auto accept is prevented by validations' do
      it 'if competitor limit is reached' do
        auto_accept_comp.competitor_limit = 5
        FactoryBot.create_list(:registration, 5, :accepted, competition: auto_accept_comp)
        expect(reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.auto_accept
        expect(reg.errors[:competitor_limit]).to include('The competition is full.')
        expect(reg.reload.competing_status).to eq('pending')
      end

      it 'if competitor limit is exceeded' do
        auto_accept_comp.competitor_limit = 5
        FactoryBot.create_list(:registration, 6, :accepted, :skip_validations, competition: auto_accept_comp)
        expect(reg.competing_status).to eq('pending')

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.auto_accept
        expect(reg.errors[:competitor_limit]).to include('The competition is full.')
        expect(reg.reload.competing_status).to eq('pending')
      end

      it 'if registration is part of a series with an already-accepted registration' do
        registration = FactoryBot.create(:registration, :accepted)

        series = FactoryBot.create(:competition_series)
        competitionA = registration.competition
        competitionA.update!(competition_series: series)
        competitionB = FactoryBot.create(:competition, :registration_open, :auto_accept, competition_series: series, series_base: competitionA)
        regB = FactoryBot.create(:registration, user: registration.user, competition: competitionB)

        FactoryBot.create(:registration_payment, :skip_create_hook, registration: regB, competition: competitionB)

        regB.auto_accept
        expect(regB.errors[:competition_id]).to include('You can only be accepted for one Series competition at a time.')
        expect(regB.reload.competing_status).to eq('pending')
      end
    end

    it 'can still create non-accepted registrations if the competitor list is full' do
      auto_accept_comp.competitor_limit = 5
      FactoryBot.create_list(:registration, 5, :accepted, competition: auto_accept_comp)
      expect(FactoryBot.create(:registration, :waiting_list, competition: auto_accept_comp)).to be_valid
    end
  end
end
