# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Registration do
  let(:registration) { create(:registration) }

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
    let(:registration) { build(:registration) }

    it "requires user on create" do
      expect(build(:registration, user_id: nil)).to be_invalid_with_errors(user: ["can't be blank"])
    end

    it "requires user country" do
      user = create(:user, country_iso2: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a region"])
    end

    it "requires user gender" do
      user = create(:user, gender: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a gender"])
    end

    it "requires user dob" do
      user = create(:user, dob: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a birthdate"])
    end

    it "user cant register if banned when competitor starts" do
      user = create(:user, :banned)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: [I18n.t('registrations.errors.banned_html').html_safe])
    end

    it 'user can register if ban ends before competition start' do
      user = create(:user, :briefly_banned)
      registration.user = user
      registration.validate
      expect(registration.errors[:user_id]).not_to include(I18n.t('registrations.errors.banned_html').html_safe)
    end
  end

  it "doesn't invalidate existing registration when the competitor is banned" do
    user = create(:user, :banned)
    registration.user = user
    expect(registration).to be_valid
  end

  it "allows deleting a registration of a banned competitor" do
    user = create(:user, :banned)
    registration.user = user
    registration.save!
    registration.competing_status = Registrations::Helper::STATUS_CANCELLED
    expect(registration).to be_valid
  end

  it "doesn't allow undeleting a registration of a banned competitor" do
    user = create(:user, :banned)
    registration.user = user
    registration.competing_status = Registrations::Helper::STATUS_CANCELLED
    registration.save!
    registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
    expect(registration).to be_invalid_with_errors(user_id: [I18n.t('registrations.errors.undelete_banned')])
  end

  it "allows undeleting a banned competitor if ban ends before comp starts" do
    user = create(:user, :briefly_banned)
    registration.user = user
    registration.competing_status = Registrations::Helper::STATUS_CANCELLED
    registration.save!
    registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
    registration.validate
    expect(registration.errors[:user_id]).not_to include(I18n.t('registrations.errors.undelete_banned'))
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
    let(:competition) { create(:competition, :with_guest_limit, guests_per_registration_limit: guest_limit) }

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

  context "with upper guest limit not enabled" do
    it "allows guests greater than guest limit" do
      guest_limit = 1
      competition = create(:competition, guests_per_registration_limit: guest_limit, guest_entry_status: Competition.guest_entry_statuses['free'])
      registration.competition = competition
      registration.guests = 10
      expect(registration.guests).to be > registration.guest_limit
      expect(registration).to be_valid
    end

    it "does not allow guests greater than guest hard limit" do
      guest_limit = 1
      competition = create(:competition, guests_per_registration_limit: guest_limit, guest_entry_status: Competition.guest_entry_statuses['free'])
      registration.competition = competition
      registration.guests = 1_000_000
      expect(registration).to be_invalid_with_errors(guests: ["must be less than or equal to 99"])
    end

    it "requires guests greater than 0" do
      registration.guests = -1
      expect(registration).to be_invalid_with_errors(guests: ["must be greater than or equal to 0"])
    end
  end

  context "number of events selected" do
    event_ids = %w[222 333 444 555 666 777]
    event_limit = event_ids.length - 2

    context "with event limit" do
      let(:competition) { create(:competition, :with_event_limit, events_per_registration_limit: event_limit, event_ids: event_ids) }

      it "blocks registrations when zero events are selected" do
        registration = build(:registration, competition: competition, events: [])
        expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.must_register')])
      end

      it "allows registration when just one is event selected" do
        registration = build(:registration, competition: competition, events: competition.events.first)
        expect(registration).to be_valid
      end

      it "allows registration when number of events selected is less than limit" do
        registration = build(:registration, competition: competition, events: competition.events.first(event_limit - 1))
        expect(registration).to be_valid
      end

      it "allows registration when number of events selected is equal to limit" do
        registration = build(:registration, competition: competition, events: competition.events.first(event_limit))
        expect(registration).to be_valid
      end

      it "blocks registration when number of events selected is greater than limit" do
        registration = build(:registration, competition: competition, events: competition.events)
        expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.exceeds_event_limit', count: event_limit)])
      end
    end

    context "without event limit" do
      let(:competition) { create(:competition, event_ids: event_ids) }

      it "blocks registrations when zero events are selected" do
        registration = build(:registration, competition: competition, events: [])
        expect(registration).to be_invalid_with_errors(registration_competition_events: [I18n.t('registrations.errors.must_register')])
      end

      it "allows registration when all events are selected" do
        registration = build(:registration, competition: competition, events: competition.events)
        expect(registration).to be_valid
      end
    end
  end

  context "when the competition is part of a series" do
    let!(:series) { create(:competition_series, name: "Registration Test Series 2015") }

    let!(:partner_competition) { create(:competition, series_base: registration.competition, competition_series: series) }
    let!(:partner_registration) { create(:registration, :pending, competition: partner_competition, user: registration.user) }

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
    let!(:user) { create(:user_with_wca_id) }
    let!(:previous_competition) do
      create(
        :competition,
        start_date: '2021-02-01',
        end_date: '2021-02-01',
      )
    end
    let!(:result) do
      create(
        :result,
        person_id: user.wca_id,
        competition: previous_competition,
        event_id: '333',
        best: 1200,
        average: 1500,
      )
    end
    let!(:competition) do
      create(
        :competition,
        event_ids: %w[333],
      )
    end
    let!(:competition_event) do
      CompetitionEvent.find_by(competition_id: competition.id, event_id: '333')
    end
    let!(:registration) do
      create(
        :registration,
        competition: competition,
        user: user,
      )
    end

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
      expect(registration).to be_invalid_with_errors(
        registration_competition_events: ["is invalid"],
      )
      rce = registration.registration_competition_events.find_by(competition_event: competition_event)
      expect(rce).to be_invalid_with_errors(
        competition_event: ["You cannot register for events you are not qualified for."],
      )
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
      registration = create(:registration, :cancelled)

      expect(registration.cancelled?).to be(true)
      expect(registration.to_wcif['status']).to eq('deleted')
    end

    it 'rejected state returns deleted status' do
      registration = create(:registration, :rejected)

      expect(registration.rejected?).to be(true)
      expect(registration.to_wcif['status']).to eq('deleted')
    end

    it 'accepted state returns accepted status' do
      registration = create(:registration, :accepted)

      expect(registration.accepted?).to be(true)
      expect(registration.to_wcif['status']).to eq('accepted')
    end

    it 'pending state returns pending status' do
      registration = create(:registration, :pending)

      expect(registration.pending?).to be(true)
      expect(registration.to_wcif['status']).to eq('pending')
    end

    it 'waitlisted state returns pending status' do
      registration = create(:registration, :waiting_list)

      expect(registration.waitlisted?).to be(true)
      expect(registration.to_wcif['status']).to eq('pending')
    end
  end

  describe '#process_update' do
    it 'updates multiple properties simultaneously' do
      registration.update_lanes!(
        {
          user_id: registration.user.id, guests: 3, competing: {
            admin_comment: 'updated admin comment', comment: 'user comment', status: 'accepted', event_ids: %w[333 555]
          }
        }.with_indifferent_access,
        registration.user.id,
      )

      registration.reload
      expect(registration.comments).to eq('user comment')
      expect(registration.administrative_notes).to eq('updated admin comment')
      expect(registration.guests).to eq(3)
      expect(registration.competing_status).to eq('accepted')
      expect(registration.event_ids).to eq(%w[333 555])
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
        combined_updates = competing_status_updates.flatten
        expect(combined_updates).to match_array(REGISTRATION_TRANSITIONS)
      end

      RSpec.shared_examples 'update competing status' do |initial_status, input_status|
        it "given #{input_status}, #{initial_status} updates as expected" do
          registration = create(:registration, initial_status.to_sym)
          registration.update_lanes!({ user_id: registration.user.id, competing: { status: input_status } }.with_indifferent_access, registration.user.id)
          registration.reload
          expect(registration.competing_status).to eq(input_status)
        end
      end

      RSpec.shared_examples 'update competing status: deleted cases' do |initial_status, input_status|
        it "given #{input_status}, #{initial_status} updates as expected" do
          registration = create(:registration, input_status.to_sym)
          registration.update_lanes!({ user_id: registration.user.id, competing: { status: input_status } }.with_indifferent_access, registration.user.id)
          expect(registration.competing_status).to eq(Registrations::Helper::STATUS_CANCELLED)
        end
      end

      competing_status_updates.each do |params|
        it_behaves_like 'update competing status', params[:initial_status], params[:input_status]
      end
    end

    it 'updates guests' do
      registration.update_lanes!({ user_id: registration.user.id, guests: 5 }.with_indifferent_access, registration.user.id)
      registration.reload
      expect(registration.guests).to eq(5)
    end

    # TODO: Should we change "comments" db field to "competing_comments"?
    it 'updates competing comment' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { comment: 'test comment' } }.with_indifferent_access, registration.user.id)
      registration.reload
      expect(registration.comments).to eq('test comment')
    end

    it 'updates admin comment' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { admin_comment: 'test admin comment' } }.with_indifferent_access, registration.user.id)
      registration.reload
      expect(registration.administrative_notes).to eq('test admin comment')
    end

    it 'removes events' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { event_ids: ['333'] } }.with_indifferent_access, registration.user.id)
      registration.reload
      expect(registration.event_ids).to eq(['333'])
    end

    it 'adds events' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { event_ids: %w[333 444 555] } }.with_indifferent_access, registration.user)
      registration.reload
      expect(registration.event_ids).to eq(%w[333 444 555])
    end

    it 'updates registration history' do
      registration.update_lanes!({ user_id: registration.user.id, competing: { event_ids: %w[333 444 555] } }.with_indifferent_access, registration.user.id)
      last_entry = registration.reload.registration_history.entries.last
      expect(last_entry[:actor_type]).to eq('user')
      expect(last_entry[:actor_id].to_i).to eq(registration.user.id)
      expect(last_entry[:changed_attributes]).to eq({ event_ids: %w[444 555] })
    end

    describe 'update waiting list position' do
      let(:competition) { create(:competition, :registration_open, :editable_registrations, :with_organizer) }
      let(:waiting_list) { competition.waiting_list }

      let!(:reg1) { create(:registration, :waiting_list, competition: competition) }
      let!(:reg2) { create(:registration, :waiting_list, competition: competition) }
      let!(:reg3) { create(:registration, :waiting_list, competition: competition) }
      let!(:reg4) { create(:registration, :waiting_list, competition: competition) }
      let!(:reg5) { create(:registration, :waiting_list, competition: competition) }

      it 'adds to waiting list' do
        reg = create(:registration, competition: competition)
        reg.update_lanes!({ user_id: reg.user.id, competing: { status: 'waiting_list' } }.with_indifferent_access, reg.user.id)

        expect(reg.waiting_list_position).to eq(6)
      end

      it 'no change if we try to add a registration on the waiting list' do
        reg1.update_lanes!({ user_id: reg1.user.id, competing: { status: 'waiting_list' } }.with_indifferent_access, reg1.user.id)

        expect(reg1.waiting_list_position).to eq(1)
        expect(reg2.waiting_list_position).to eq(2)
        expect(reg3.waiting_list_position).to eq(3)
        expect(reg4.waiting_list_position).to eq(4)
        expect(reg5.waiting_list_position).to eq(5)

        expect(waiting_list.entries.count).to eq(5)
      end

      it 'removes from waiting list' do
        reg4.update_lanes!({ user_id: reg4.user.id, competing: { status: 'pending' } }.with_indifferent_access, reg4.user.id)

        expect(reg4.waiting_list_position).to be_nil
        expect(waiting_list.entries.count).to eq(4)
      end

      it 'moves backwards in waiting list' do
        reg2.update_lanes!({ user_id: reg2.user.id, competing: { waiting_list_position: 5 } }.with_indifferent_access, reg2.user.id)

        expect(reg1.waiting_list_position).to eq(1)
        expect(reg2.waiting_list_position).to eq(5)
        expect(reg3.waiting_list_position).to eq(2)
        expect(reg4.waiting_list_position).to eq(3)
        expect(reg5.waiting_list_position).to eq(4)

        expect(waiting_list.entries.count).to eq(5)
      end

      it 'moves forwards in waiting list' do
        reg5.update_lanes!({ user_id: reg5.user.id, competing: { waiting_list_position: 1 } }.with_indifferent_access, reg5.user.id)

        expect(reg1.waiting_list_position).to eq(2)
        expect(reg2.waiting_list_position).to eq(3)
        expect(reg3.waiting_list_position).to eq(4)
        expect(reg4.waiting_list_position).to eq(5)
        expect(reg5.waiting_list_position).to eq(1)

        expect(waiting_list.entries.count).to eq(5)
      end

      it 'moves to the same position' do
        reg5.update_lanes!({ user_id: reg5.user.id, competing: { waiting_list_position: 5 } }.with_indifferent_access, reg5.user.id)

        expect(reg1.waiting_list_position).to eq(1)
        expect(reg2.waiting_list_position).to eq(2)
        expect(reg3.waiting_list_position).to eq(3)
        expect(reg4.waiting_list_position).to eq(4)
        expect(reg5.waiting_list_position).to eq(5)

        expect(waiting_list.entries.count).to eq(5)
      end

      it 'move request for a registration that isnt in the waiting list' do
        reg = create(:registration, competition: competition)
        reg.update_lanes!({ user_id: reg.user.id, competing: { waiting_list_position: 3 } }.with_indifferent_access, reg.user.id)

        expect(reg.waiting_list_position).to be_nil

        expect(reg1.waiting_list_position).to eq(1)
        expect(reg2.waiting_list_position).to eq(2)
        expect(reg3.waiting_list_position).to eq(3)
        expect(reg4.waiting_list_position).to eq(4)
        expect(reg5.waiting_list_position).to eq(5)
      end
    end
  end

  describe '#auto_accept' do
    let(:auto_accept_comp) { create(:competition, :live_auto_accept, :registration_open) }
    let!(:reg) { create(:registration, competition: auto_accept_comp) }

    describe 'return values' do
      context 'on success' do
        it 'returns succeeded:true and info:accepted' do
          create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
          response = reg.attempt_auto_accept

          expect(response[:succeeded]).to be(true)
          expect(response[:info]).to eq('accepted')
        end

        it 'returns info:waiting_list if reg was waitlisted' do
          auto_accept_comp.competitor_limit = 1
          create(:registration, :accepted, competition: auto_accept_comp)
          create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
          response = reg.attempt_auto_accept

          expect(response[:succeeded]).to be(true)
          expect(response[:info]).to eq('waiting_list')
        end
      end

      context 'on fail' do
        it 'on fail, returns succeeded:false and info:{error code}' do
          response = reg.attempt_auto_accept

          expect(response[:succeeded]).to be(false)
          expect(response[:info]).to eq(-7001)
        end
      end
    end

    it 'works for a paid pending registration' do
      expect(reg.competing_status).to eq('pending')

      create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

      reg.attempt_auto_accept
      expect(reg.reload.competing_status).to eq('accepted')
      expect(reg.registration_history_entries.last.actor_type).to eq('system')
      expect(reg.registration_history_entries.last.actor_id).to eq('auto-accept')
    end

    it 'works for a competitor who included a donation in their payment' do
      expect(reg.competing_status).to eq('pending')

      create(:registration_payment, :skip_create_hook, :with_donation, registration: reg, competition: auto_accept_comp)

      reg.attempt_auto_accept
      expect(reg.reload.competing_status).to eq('accepted')
    end

    it 'doesnt auto accept an unpaid pending competitor' do
      expect(reg.competing_status).to eq('pending')

      reg.attempt_auto_accept
      expect(reg.reload.competing_status).to eq('pending')
      expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7001")
    end

    it 'doesnt auto accept an unpaid waiting list competitor' do
      reg.update(competing_status: 'waiting_list')

      reg.attempt_auto_accept
      expect(reg.reload.competing_status).to eq('waiting_list')
      expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7001")
    end

    it 'doesnt auto accept a competitor who gets refunded' do
      expect(reg.competing_status).to eq('pending')

      create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
      create(:registration_payment, :refund, :skip_create_hook, registration: reg, competition: auto_accept_comp)

      reg.reload.attempt_auto_accept
      expect(reg.reload.competing_status).to eq('pending')
      expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7001")
    end

    it 'accepts the last competitor on the auto-accept disable threshold' do
      auto_accept_comp.auto_accept_disable_threshold = 5
      create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
      expect(reg.competing_status).to eq('pending')

      create_list(:registration, 4, :accepted, competition: auto_accept_comp)

      # Add some non-accepted registrations to make sure we're checking accepted registrations only
      create_list(:registration, 5, competition: auto_accept_comp)

      create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

      reg.attempt_auto_accept
      expect(reg.reload.competing_status).to eq('accepted')
    end

    it 'can auto-accept the first user on the waiting list' do
      waiting_list_reg = create(:registration, :waiting_list, competition: auto_accept_comp)

      create(:registration_payment, :skip_create_hook, registration: waiting_list_reg, competition: auto_accept_comp)

      waiting_list_reg.attempt_auto_accept
      expect(waiting_list_reg.reload.competing_status).to eq('accepted')
    end

    context 'auto-accept does not succeed' do
      it 'if a waitlisted registration is not first in the waiting list' do
        create_list(:registration, 3, :waiting_list, competition: auto_accept_comp)
        waiting_list_reg = create(:registration, :waiting_list, competition: auto_accept_comp)
        expect(waiting_list_reg.waiting_list_position).to eq(4)

        create(:registration_payment, :skip_create_hook, registration: waiting_list_reg, competition: auto_accept_comp)

        waiting_list_reg.attempt_auto_accept
        expect(waiting_list_reg.reload.competing_status).to eq('waiting_list')
        expect(waiting_list_reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7003")
      end

      it 'does not accept a pending registration ahead of a waitlisted one' do
        create(:registration, :waiting_list, competition: auto_accept_comp)
        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('waiting_list')
      end

      it 'if registration_payment.is_completed: false' do
        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp, is_completed: false)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('pending')
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7001")
      end

      it 'if status is cancelled' do
        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.update(competing_status: 'cancelled')

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('cancelled')
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7003")
      end

      it 'if status is rejected' do
        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
        reg.update(competing_status: 'rejected')

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('rejected')
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7003")
      end

      it 'if status is accepted' do
        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
        reg.update(competing_status: 'accepted')

        reg.attempt_auto_accept
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7003")
      end

      it 'if status is waiting_list and position isnt first' do
        create(:registration, :waiting_list, competition: auto_accept_comp)
        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)
        reg.update(competing_status: 'waiting_list')
        auto_accept_comp.waiting_list.add(reg)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('waiting_list')
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7003")
      end

      it 'before registration has opened' do
        unopened_comp = create(:competition, :live_auto_accept, :registration_not_opened)
        unopened_reg = create(:registration, competition: unopened_comp)

        expect(unopened_reg.competing_status).to eq('pending')

        create(:registration_payment, :skip_create_hook, registration: unopened_reg, competition: unopened_comp)

        unopened_reg.attempt_auto_accept
        expect(unopened_reg.reload.competing_status).to eq('pending')
        expect(unopened_reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7005")
      end

      it 'after registration has closed' do
        closed_comp = create(:competition, :live_auto_accept)
        closed_reg = create(:registration, competition: closed_comp)

        expect(closed_reg.competing_status).to eq('pending')

        create(:registration_payment, :skip_create_hook, registration: closed_reg, competition: closed_comp)

        closed_reg.attempt_auto_accept
        expect(closed_reg.reload.competing_status).to eq('pending')
        expect(closed_reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7005")
      end

      it 'unless auto-accept is enabled' do
        no_auto_accept = create(:competition, :registration_open)
        no_auto_reg = create(:registration, competition: no_auto_accept)

        expect(no_auto_reg.competing_status).to eq('pending')

        create(:registration_payment, registration: no_auto_reg, competition: no_auto_accept)

        no_auto_reg.attempt_auto_accept
        expect(no_auto_reg.reload.competing_status).to eq('pending')
        expect(no_auto_reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7002")
      end

      it 'when accepted registrations match the auto-accept disable threshold' do
        auto_accept_comp.auto_accept_disable_threshold = 5
        create_list(:registration, 5, :accepted, competition: auto_accept_comp)
        expect(reg.competing_status).to eq('pending')

        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('pending')
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7004")
      end

      it 'when accepted registrations exceed the auto-accept disable threshold' do
        auto_accept_comp.auto_accept_disable_threshold = 5
        create_list(:registration, 6, :skip_validations, :accepted, competition: auto_accept_comp)
        expect(reg.competing_status).to eq('pending')

        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('pending')
        expect(reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq("-7004")
      end
    end

    context 'log when auto accept is prevented by validations' do
      let(:limited_comp) do
        create(
          :competition, :registration_open, :with_competitor_limit, :live_auto_accept, competitor_limit: 5, auto_accept_disable_threshold: nil
        )
      end
      let!(:prevented_reg) { create(:registration, competition: limited_comp) }

      it 'if competitor limit is reached and first on waiting list' do
        create_list(:registration, 5, :accepted, competition: limited_comp)

        waiting_list_reg = create(:registration, :waiting_list, competition: limited_comp)
        create(:registration_payment, :skip_create_hook, registration: waiting_list_reg, competition: limited_comp)
        expect(waiting_list_reg.reload.competing_status).to eq('waiting_list')

        waiting_list_reg.attempt_auto_accept
        expect(waiting_list_reg.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq('-4006')
        expect(waiting_list_reg.reload.competing_status).to eq('waiting_list')
      end

      it 'if registration is part of a series with an already-accepted registration' do
        registration = create(:registration, :accepted)

        series = create(:competition_series)
        competition_a = registration.competition
        competition_a.update!(competition_series: series)
        competition_b = create(:competition, :registration_open, :live_auto_accept, competition_series: series, series_base: competition_a)
        reg_b = create(:registration, user: registration.user, competition: competition_b)

        create(:registration_payment, :skip_create_hook, registration: reg_b, competition: competition_b)

        reg_b.attempt_auto_accept
        error_string = ['You can only be accepted for one Series competition at a time.'].to_s
        expect(reg_b.registration_history.last[:changed_attributes][:auto_accept_failure_reasons]).to eq(error_string)
        expect(reg_b.reload.competing_status).to eq('pending')
      end
    end

    context 'auto accept onto waiting list' do
      it 'works with no auto_accept_disable_threshold' do
        auto_accept_comp.competitor_limit_enabled = true
        auto_accept_comp.competitor_limit = 5
        auto_accept_comp.auto_accept_disable_threshold = nil
        create_list(:registration, 5, :accepted, competition: auto_accept_comp)

        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('waiting_list')
        expect(reg.waiting_list_position).to eq(1)
        expect(reg.registration_history_entries.last.actor_type).to eq('system')
        expect(reg.registration_history_entries.last.actor_id).to eq('auto-accept')
      end

      it 'gets prevented by auto-accept threshold' do
        auto_accept_comp.competitor_limit_enabled = true
        auto_accept_comp.competitor_limit = 5
        auto_accept_comp.auto_accept_disable_threshold = 4
        create_list(:registration, 5, :accepted, competition: auto_accept_comp)

        create(:registration_payment, :skip_create_hook, registration: reg, competition: auto_accept_comp)

        reg.attempt_auto_accept
        expect(reg.reload.competing_status).to eq('pending')
        expect(reg.waiting_list_position).to be_nil
      end
    end
  end

  describe '#bulk_auto_accept' do
    context 'when competitor limit' do
      let(:auto_accept_comp) { create(:competition, :bulk_auto_accept, :registration_open, :with_competitor_limit, competitor_limit: 10, auto_accept_disable_threshold: nil) }

      before do
        create_list(:registration, 5, :accepted, competition: auto_accept_comp)
      end

      context 'return values' do
        let(:waitlisted1) { create(:registration, :waiting_list, competition: auto_accept_comp) }
        let(:waitlisted2) { create(:registration, :waiting_list, competition: auto_accept_comp) }
        let(:waitlisted3) { create(:registration, :waiting_list, competition: auto_accept_comp) }
        let(:pending1) { create(:registration, :pending, competition: auto_accept_comp) }
        let(:pending2) { create(:registration, :pending, competition: auto_accept_comp) }

        before do
          create(:registration_payment, :skip_create_hook, registration: waitlisted1, competition: auto_accept_comp)
          create(:registration_payment, :skip_create_hook, registration: waitlisted2, competition: auto_accept_comp)
          create(:registration_payment, :skip_create_hook, registration: pending1, competition: auto_accept_comp)
          create(:registration_payment, :skip_create_hook, registration: pending2, competition: auto_accept_comp)
          auto_accept_comp.competitor_limit = 6
          @result = Registration.bulk_auto_accept(auto_accept_comp)
        end

        it 'only returns waiting list values up to and including the first failure' do
          expect(@result.length).to be(4)
          expect(@result[waitlisted1.id][:succeeded]).to be(true)
          expect(@result[waitlisted2.id][:succeeded]).to be(false)
          expect(@result[pending1.id][:succeeded]).to be(true)
          expect(@result[pending2.id][:succeeded]).to be(true)
        end

        it 'accepted registration has reg_id, succeeded:true, info:accepted' do
          succeeded_response = @result[waitlisted1.id]
          expect(succeeded_response[:succeeded]).to be(true)
          expect(succeeded_response[:info]).to eq('accepted')
        end

        it 'non-accepted registration has reg_id, succeeded:false and info:{error_code}' do
          unsucceeded_response = @result[waitlisted2.id]
          expect(unsucceeded_response[:succeeded]).to be(false)
          expect(unsucceeded_response[:info]).to eq(-4006)
        end

        it 'waitlisted registration has info:waiting_list' do
          succeeded_response = @result[pending1.id]
          expect(succeeded_response[:succeeded]).to be(true)
          expect(succeeded_response[:info]).to eq('waiting_list')
        end
      end

      it 'accepts paid-pending registrations' do
        pending_registrations = create_list(:registration, 9, :pending, competition: auto_accept_comp)
        pending_registrations.reverse_each do |r|
          create(:registration_payment, :skip_create_hook, registration: r, competition: auto_accept_comp)
        end
        create_list(:registration, 5, :pending, competition: auto_accept_comp)

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(10)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(4) # Excess paid-pending registrations get waitlisted
        expect(auto_accept_comp.registrations.competing_status_pending.count).to eq(5) # Unpaid registrations werent accepted

        accepted_registrations = auto_accept_comp.registrations.competing_status_accepted
        accepted_timestamps = accepted_registrations.filter_map { |r| r.registration_payments.first&.updated_at }
        earliest_accepted_timestamp = accepted_timestamps.min

        auto_accept_comp.registrations.competing_status_waiting_list.each do |waitlisted_registration|
          expect(waitlisted_registration.registration_payments.first.updated_at).to be >= earliest_accepted_timestamp
        end
      end

      it 'accepts waitlisted registrations' do
        create_list(:registration, 9, :paid, :waiting_list, competition: auto_accept_comp)
        expected_accepted = auto_accept_comp.waiting_list.entries[..4]
        expected_remaining = auto_accept_comp.waiting_list.entries[5..]

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(10)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(4)

        expect((expected_accepted - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

        expect(auto_accept_comp.waiting_list.reload.entries).to eq(expected_remaining)
      end

      it 'accepts waitlisted registrations before pending registrations - waitlisted fills all spots' do
        create_list(:registration, 9, :paid, :waiting_list, competition: auto_accept_comp)
        create_list(:registration, 3, :paid, :pending, competition: auto_accept_comp)
        initial_pending_ids = auto_accept_comp.registrations.competing_status_pending.ids
        expected_accepted = auto_accept_comp.waiting_list.entries[..4]
        expected_remaining = auto_accept_comp.waiting_list.entries[5..] + initial_pending_ids

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(10)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(7)

        expect((expected_accepted - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

        expect(auto_accept_comp.waiting_list.reload.entries).to eq(expected_remaining)
      end

      it 'accepts waitlisted registrations before pending registrations - only a few waitlisted' do
        create_list(:registration, 2, :paid, :waiting_list, competition: auto_accept_comp)
        waitlisted_ids = auto_accept_comp.registrations.competing_status_waiting_list.ids
        pending_registrations = create_list(:registration, 9, :pending, competition: auto_accept_comp)
        pending_registrations.reverse_each do |r|
          create(:registration_payment, :skip_create_hook, registration: r, competition: auto_accept_comp)
        end
        create_list(:registration, 5, :pending, competition: auto_accept_comp)

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(10)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(6) # Excess paid-pending registrations get waitlisted
        expect(auto_accept_comp.registrations.competing_status_pending.count).to eq(5) # Unpaid registrations werent accepted

        expect((waitlisted_ids - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

        accepted_registrations = auto_accept_comp.registrations.competing_status_accepted
        accepted_timestamps = accepted_registrations.filter_map { |r| r.registration_payments.first&.updated_at }
        earliest_accepted_timestamp = accepted_timestamps.min

        auto_accept_comp.registrations.competing_status_waiting_list.each do |waitlisted_registration|
          expect(waitlisted_registration.registration_payments.first.updated_at).to be >= earliest_accepted_timestamp
        end
      end
    end

    context 'when disable_threshold' do
      let(:threshold_auto_accept_comp) do
        create(:competition, :bulk_auto_accept, :registration_open, :with_competitor_limit, auto_accept_disable_threshold: 9)
      end

      before do
        create_list(:registration, 5, :accepted, competition: threshold_auto_accept_comp)
      end

      it 'accepts paid-pending registrations' do
        pending_registrations = create_list(:registration, 9, :pending, competition: threshold_auto_accept_comp)
        pending_registrations.reverse_each do |r|
          create(:registration_payment, :skip_create_hook, registration: r, competition: threshold_auto_accept_comp)
        end
        create_list(:registration, 5, :pending, competition: threshold_auto_accept_comp)

        Registration.bulk_auto_accept(threshold_auto_accept_comp)
        expect(threshold_auto_accept_comp.registrations.competing_status_accepted.count).to eq(9)
        expect(threshold_auto_accept_comp.registrations.competing_status_pending.count).to eq(10) # Unpaid registrations werent accepted

        accepted_registrations = threshold_auto_accept_comp.registrations.competing_status_accepted
        accepted_timestamps = accepted_registrations.filter_map { |r| r.registration_payments.first&.updated_at }
        earliest_accepted_timestamp = accepted_timestamps.min

        threshold_auto_accept_comp.registrations.competing_status_waiting_list.each do |waitlisted_registration|
          expect(waitlisted_registration.registration_payments.first.updated_at).to be >= earliest_accepted_timestamp
        end
      end

      it 'accepts waitlisted registrations' do
        create_list(:registration, 9, :paid, :waiting_list, competition: threshold_auto_accept_comp)
        expected_accepted = threshold_auto_accept_comp.waiting_list.entries[..3]
        expected_remaining = threshold_auto_accept_comp.waiting_list.entries[4..]

        Registration.bulk_auto_accept(threshold_auto_accept_comp)
        expect(threshold_auto_accept_comp.registrations.competing_status_accepted.count).to eq(9)
        expect(threshold_auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(5)

        expect((expected_accepted - threshold_auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

        expect(threshold_auto_accept_comp.waiting_list.reload.entries).to eq(expected_remaining)
      end

      it 'accepts waitlisted registrations before pending registrations - waitlisted fills all spots' do
        create_list(:registration, 9, :paid, :waiting_list, competition: threshold_auto_accept_comp)
        create_list(:registration, 3, :paid, :pending, competition: threshold_auto_accept_comp)
        threshold_auto_accept_comp.registrations.competing_status_pending.ids
        expected_accepted = threshold_auto_accept_comp.waiting_list.entries[..3]
        expected_remaining = threshold_auto_accept_comp.waiting_list.entries[4..]

        Registration.bulk_auto_accept(threshold_auto_accept_comp)
        expect(threshold_auto_accept_comp.registrations.competing_status_accepted.count).to eq(9)
        expect(threshold_auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(5)
        expect(threshold_auto_accept_comp.registrations.competing_status_pending.count).to eq(3)

        expect((expected_accepted - threshold_auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

        expect(threshold_auto_accept_comp.waiting_list.reload.entries).to eq(expected_remaining)
      end

      it 'accepts waitlisted registrations before pending registrations - only a few waitlisted' do
        create_list(:registration, 2, :paid, :waiting_list, competition: threshold_auto_accept_comp)
        waitlisted_ids = threshold_auto_accept_comp.registrations.competing_status_waiting_list.ids
        pending_registrations = create_list(:registration, 9, :pending, competition: threshold_auto_accept_comp)
        pending_registrations.reverse_each do |r|
          create(:registration_payment, :skip_create_hook, registration: r, competition: threshold_auto_accept_comp)
        end
        create_list(:registration, 5, :pending, competition: threshold_auto_accept_comp)

        Registration.bulk_auto_accept(threshold_auto_accept_comp)
        expect(threshold_auto_accept_comp.registrations.competing_status_accepted.count).to eq(9)
        expect(threshold_auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(0) # Excess paid-pending registrations get waitlisted
        expect(threshold_auto_accept_comp.registrations.competing_status_pending.count).to eq(12) # Unpaid registrations werent accepted

        expect((waitlisted_ids - threshold_auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)

        accepted_registrations = threshold_auto_accept_comp.registrations.competing_status_accepted
        accepted_timestamps = accepted_registrations.filter_map { |r| r.registration_payments.first&.updated_at }
        earliest_accepted_timestamp = accepted_timestamps.min

        threshold_auto_accept_comp.registrations.competing_status_waiting_list.each do |waitlisted_registration|
          expect(waitlisted_registration.registration_payments.first.updated_at).to be >= earliest_accepted_timestamp
        end
      end
    end

    context 'no limit' do
      let(:auto_accept_comp) { create(:competition, :bulk_auto_accept, :registration_open, auto_accept_disable_threshold: nil, competitor_limit: 20) }

      before do
        create_list(:registration, 5, :accepted, competition: auto_accept_comp)
      end

      it 'accepts paid-pending registrations' do
        pending_registrations = create_list(:registration, 9, :pending, competition: auto_accept_comp)
        pending_registrations.reverse_each do |r|
          create(:registration_payment, :skip_create_hook, registration: r, competition: auto_accept_comp)
        end
        create_list(:registration, 5, :pending, competition: auto_accept_comp)

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(14)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(0) # Excess paid-pending registrations get waitlisted
        expect(auto_accept_comp.registrations.competing_status_pending.count).to eq(5) # Unpaid registrations werent accepted

        accepted_registrations = auto_accept_comp.registrations.competing_status_accepted
        accepted_timestamps = accepted_registrations.filter_map { |r| r.registration_payments.first&.updated_at }
        earliest_accepted_timestamp = accepted_timestamps.min

        auto_accept_comp.registrations.competing_status_waiting_list.each do |waitlisted_registration|
          expect(waitlisted_registration.registration_payments.first.updated_at).to be >= earliest_accepted_timestamp
        end
      end

      it 'accepts waitlisted registrations' do
        create_list(:registration, 9, :paid, :waiting_list, competition: auto_accept_comp)
        expected_accepted = auto_accept_comp.waiting_list.entries

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(14)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(0)

        expect((expected_accepted - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)
      end

      it 'accepts a combination of registrations' do
        create_list(:registration, 9, :paid, :waiting_list, competition: auto_accept_comp)
        create_list(:registration, 3, :paid, :pending, competition: auto_accept_comp)
        auto_accept_comp.registrations.competing_status_pending.ids
        expected_accepted = auto_accept_comp.waiting_list.entries

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(17)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(0)
        expect(auto_accept_comp.registrations.competing_status_pending.count).to eq(0)

        expect((expected_accepted - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)
      end

      it 'leaves registrations in other statuses untouched' do
        create_list(:registration, 9, :paid, :waiting_list, competition: auto_accept_comp)
        create_list(:registration, 3, :paid, :pending, competition: auto_accept_comp)
        create_list(:registration, 4, :paid, :rejected, competition: auto_accept_comp)
        create_list(:registration, 5, :paid, :cancelled, competition: auto_accept_comp)

        auto_accept_comp.registrations.competing_status_pending.ids
        expected_accepted = auto_accept_comp.waiting_list.entries

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(auto_accept_comp.registrations.competing_status_accepted.count).to eq(17)
        expect(auto_accept_comp.registrations.competing_status_waiting_list.count).to eq(0)
        expect(auto_accept_comp.registrations.competing_status_pending.count).to eq(0)
        expect(auto_accept_comp.registrations.competing_status_rejected.count).to eq(4)
        expect(auto_accept_comp.registrations.competing_status_cancelled.count).to eq(5)

        expect((expected_accepted - auto_accept_comp.registrations.competing_status_accepted.ids).empty?).to be(true)
      end
    end

    context 'refunded registration' do
      let(:auto_accept_comp) { create(:competition, :bulk_auto_accept, :registration_open, :with_competitor_limit, competitor_limit: 2, auto_accept_disable_threshold: nil) }
      let!(:reg1) { create(:registration, :pending, :paid, competition: auto_accept_comp) }
      let(:reg2) { create(:registration, :pending, competition: auto_accept_comp) }

      before do
        create(:registration, :accepted, competition: auto_accept_comp)
        create(:registration_payment, :refund, registration: reg1, competition: reg1.competition)
      end

      it 'gets accepted earlier if repaid before another registration' do
        create(:registration_payment, :skip_create_hook, registration: reg1, competition: reg1.competition)
        create(:registration_payment, :skip_create_hook, registration: reg2, competition: reg2.competition)

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(reg1.reload.competing_status).to eq('accepted')
        expect(reg2.reload.competing_status).to eq('waiting_list')
      end

      it 'gets accepted later if repaid after another registration' do
        create(:registration_payment, :skip_create_hook, registration: reg2, competition: reg2.competition)
        create(:registration_payment, :skip_create_hook, registration: reg1, competition: reg1.competition)

        Registration.bulk_auto_accept(auto_accept_comp)
        expect(reg2.reload.competing_status).to eq('accepted')
        expect(reg1.reload.competing_status).to eq('waiting_list')
      end
    end
  end

  it 'can still create non-accepted registrations if the competitor list is full' do
    competition = create(:competition, :registration_open)
    competition.competitor_limit = 5
    create_list(:registration, 5, :accepted, competition: competition)
    expect(create(:registration, :waiting_list, competition: competition)).to be_valid
  end

  describe 'hooks' do
    context 'auto close' do
      it 'positive, captured registration_payment calls registration.consider_auto_close' do
        competition = create(:competition)
        reg = create(:registration, competition: competition)
        expect(reg).to receive(:consider_auto_close).once

        create(
          :registration_payment,
          registration: reg,
          user: reg.user,
          amount_lowest_denomination: reg.competition.base_entry_fee_lowest_denomination,
        )
      end

      it 'doesnt call registration.consider auto_close! for a non-captured registration_payment' do
        competition = create(:competition)
        reg = create(:registration, competition: competition)
        expect(reg).to receive(:consider_auto_close).exactly(0).times

        create(
          :registration_payment,
          registration: reg,
          user: reg.user,
          amount_lowest_denomination: reg.competition.base_entry_fee_lowest_denomination,
          is_completed: false,
        )
      end

      it 'calls registration.consider_auto_close! if reg_payment gets marked as captured' do
        competition = create(:competition)
        reg = create(:registration, competition: competition)
        expect(reg).to receive(:consider_auto_close).once

        reg_payment = create(
          :registration_payment,
          registration: reg,
          user: reg.user,
          amount_lowest_denomination: reg.competition.base_entry_fee_lowest_denomination,
          is_completed: false,
        )

        reg_payment.update!(is_completed: true)
      end

      it 'doesnt call registration.auto_close! after a refund is created' do
        competition = create(:competition)
        reg = create(:registration, :paid, competition: competition)
        expect(reg).to receive(:consider_auto_close).exactly(0).times

        create(
          :registration_payment,
          registration: reg,
          user: reg.user,
          amount_lowest_denomination: -reg.competition.base_entry_fee_lowest_denomination,
          refunded_registration_payment_id: reg.registration_payments.first.id,
        )
      end

      it 'doesnt competition.attempt_auto_close! if reg is partially paid' do
        competition = create(:competition)
        expect(competition).to receive(:attempt_auto_close!).exactly(0).times

        reg = create(:registration, :partially_paid, competition: competition)
        reg.consider_auto_close
      end

      it 'calls competition.attempt_auto_close! if reg is fully paid' do
        competition = create(:competition)
        expect_any_instance_of(Competition).to receive(:attempt_auto_close!).once

        create(:registration, :paid, competition: competition)
      end
    end

    context 'auto accept' do
      let(:auto_accept_comp) { create(:competition, :live_auto_accept, :registration_open) }
      let(:pending_reg) { create(:registration, competition: auto_accept_comp) }
      let(:accepted_reg) { create(:registration, :accepted, competition: auto_accept_comp) }
      # Ensure the waiting list is populated even if waitlisted_reg isn't explicitly called
      let!(:waitlisted_reg) { create(:registration, :waiting_list, :paid_no_hooks, competition: auto_accept_comp) }

      RSpec.shared_examples 'changing accepted status' do |new_status|
        it "triggers auto accept when accepted changes to #{new_status}" do
          expect(waitlisted_reg.reload.competing_status).to eq('waiting_list')

          accepted_reg.update_lanes!(
            { user_id: accepted_reg.user.id, competing: { status: new_status } }.with_indifferent_access,
            accepted_reg.user.id,
          )
          expect(waitlisted_reg.reload.competing_status).to eq('accepted')
        end
      end

      %w[pending cancelled rejected waiting_list].each do |status|
        it_behaves_like 'changing accepted status', status
      end

      it 'has no effect if accepted registration is re-accepted' do
        expect(waitlisted_reg.reload.competing_status).to eq('waiting_list')

        pending_reg.update_lanes!(
          { user_id: pending_reg.user.id, competing: { status: 'accepted' } }.with_indifferent_access,
          pending_reg.user.id,
        )
        expect(waitlisted_reg.reload.competing_status).to eq('waiting_list')
      end

      it 'has no effect if non-accepted registration is cancelled' do
        expect(waitlisted_reg.reload.competing_status).to eq('waiting_list')

        pending_reg.update_lanes!(
          { user_id: pending_reg.user.id, competing: { status: 'cancelled' } }.with_indifferent_access,
          pending_reg.user.id,
        )
        expect(waitlisted_reg.reload.competing_status).to eq('waiting_list')
      end

      it 'has no effect if comeptition doesnt use auto accept' do
        expect(Registration).not_to receive(:bulk_auto_accept)

        auto_accept_comp.auto_accept_preference = :disabled

        accepted_reg.update_lanes!(
          { user_id: accepted_reg.user.id, competing: { status: 'cancelled' } }.with_indifferent_access,
          accepted_reg.user.id,
        )
        expect(waitlisted_reg.reload.competing_status).to eq('waiting_list')
      end
    end
  end

  describe '#newcomer_month_eligible_competitors_count' do
    let(:newcomer_month_comp) { create(:competition, :newcomer_month) }
    let!(:newcomer_reg) { create(:registration, :newcomer, :accepted, competition: newcomer_month_comp) }

    before do
      create_list(:registration, 2, :accepted, competition: newcomer_month_comp)
    end

    it 'doesnt include non-newcomers in count' do
      newcomer_reg.competing_status = "accepted"
      expect(newcomer_month_comp.registrations.count).to eq(3)
      expect(newcomer_month_comp.registrations.newcomer_month_eligible_competitors_count).to eq(1)
    end

    it 'doesnt include newcomers in non-accepted states' do
      create(:registration, :newcomer, competition: newcomer_month_comp)
      create(:registration, :newcomer, :cancelled, competition: newcomer_month_comp)
      create(:registration, :newcomer, :rejected, competition: newcomer_month_comp)
      create(:registration, :newcomer, :waiting_list, competition: newcomer_month_comp)

      expect(newcomer_month_comp.registrations.count).to eq(7)
      expect(newcomer_month_comp.registrations.newcomer_month_eligible_competitors_count).to eq(1)
    end
  end

  it 'validates presence of registered_at' do
    reg = build(:registration, registered_at: nil)
    expect(reg).not_to be_valid
    expect(reg.errors[:registered_at]).to include("can't be blank")
  end

  describe '#does_not_exceed_competitor_limit' do
    let(:competition) { create(:competition, :registration_open, competitor_limit: 3) }
    let(:accepted_reg) { build(:registration, :accepted, competition: competition) }

    before do
      create_list(:registration, 2, :accepted, competition: competition)
    end

    it 'does not include non-competing registrations in competitor limit' do
      create(:registration, :non_competing, competition: competition)
      expect(accepted_reg).to be_valid
    end
  end

  describe '#entry_fee_with_donation' do
    it 'returns a RubyMoney object' do
      expect(registration.entry_fee_with_donation).to eq(Money.new(1000, "USD"))
    end

    it 'given a donation, sums the donation and entry fee' do
      expect(registration.entry_fee_with_donation(1500)).to eq(Money.new(2500, "USD"))
    end
  end

  describe 'registrant_id' do
    it 'populates upon create' do
      expect(registration.registrant_id).to eq(1)
    end

    it 'allows registrations belonging to different competitions to have the same registrant id' do
      second_reg = create(:registration)
      expect(second_reg.competition.id).not_to eq(registration.competition.id)
      expect(second_reg.registrant_id).to eq(registration.registrant_id)

      expect(second_reg).to be_valid
      expect(registration).to be_valid
    end

    it 'assigns registrant_id based on the max value of registrant_id' do
      registration.update(registrant_id: 300)
      second_reg = create(:registration, competition: registration.competition)
      expect(second_reg.registrant_id).to eq(301)

      expect(second_reg).to be_valid
      expect(registration).to be_valid
    end

    it 'does not try to re-assign deleted registrant_ids' do
      create_list(:registration, 4, competition: registration.competition)
      Registration.find_by(registrant_id: 4).delete
      expect(Registration.count).to be(4)
      expect(Registration.maximum(:registrant_id)).to be(5)

      expect do
        @new_registration = create(:registration, competition: registration.competition)
      end.not_to raise_error

      expect(@new_registration.registrant_id).to eq(6)
    end
  end

  describe '#paid_entry_fees' do
    let(:comp) { create(:competition) }
    let(:reg) { create(:registration, :paid, competition: comp) }

    it 'correctly calculates a single payment' do
      expect(reg.paid_entry_fees.cents).to eq(1000)
    end

    it 'correctly sums multiple payments' do
      create(:registration_payment, registration: reg)
      expect(reg.reload.paid_entry_fees.cents).to eq(2000)
    end

    it 'returns 0 for a refunded payment' do
      create(:registration_payment, :refund, registration: reg)
      expect(reg.reload.paid_entry_fees.cents).to eq(0)
    end

    it 'returns net amount of multiple payments/refunds' do
      additional_payments = create_list(:registration_payment, 2, registration: reg)
      create(:registration_payment, :refund, registration: reg, refunded_registration_payment: additional_payments[0])
      create(:registration_payment, :refund, registration: reg, refunded_registration_payment: additional_payments[1])
      expect(reg.reload.paid_entry_fees.cents).to eq(1000)
    end

    it 'correctly calculates a partial refund' do
      create(:registration_payment, :refund, registration: reg, amount_lowest_denomination: -500)
      expect(reg.reload.paid_entry_fees.cents).to eq(500)
    end

    it 'only considers captured payments' do
      create(:registration_payment, registration: reg, is_completed: false)
      expect(reg.reload.paid_entry_fees.cents).to eq(1000)
    end
  end

  describe 'last_payment methods' do
    before do
      @expected_pmt = create(
        :registration_payment, registration: registration, created_at: Time.now.utc - 4, updated_at: Time.now.utc - 4, paid_at: Time.now.utc - 1
      )
      @other1 = create(
        :registration_payment, registration: registration, created_at: Time.now.utc - 3, updated_at: Time.now.utc - 3, paid_at: Time.now.utc - 3
      )
      @other2 = create(
        :registration_payment, registration: registration, created_at: Time.now.utc - 2, updated_at: Time.now.utc - 2, paid_at: Time.now.utc - 2
      )
    end

    it 'paid_at for first payment is after all timestamps for other payments' do
      expect(@expected_pmt.paid_at).to be > @other2.created_at
      expect(@expected_pmt.paid_at).to be > @other2.updated_at
      expect(@expected_pmt.paid_at).to be > @other2.paid_at
      expect(@expected_pmt.paid_at).to be > @other1.created_at
      expect(@expected_pmt.paid_at).to be > @other1.updated_at
      expect(@expected_pmt.paid_at).to be > @other1.paid_at
    end

    it 'non-paid_at timestamps for first payment are before all timestamps for other payments' do
      expect(@expected_pmt.created_at).to be < @other2.created_at
      expect(@expected_pmt.updated_at).to be < @other2.created_at
      expect(@expected_pmt.created_at).to be < @other2.updated_at
      expect(@expected_pmt.updated_at).to be < @other2.updated_at
      expect(@expected_pmt.created_at).to be < @other1.created_at
      expect(@expected_pmt.updated_at).to be < @other1.created_at
      expect(@expected_pmt.created_at).to be < @other1.updated_at
      expect(@expected_pmt.updated_at).to be < @other1.updated_at
    end

    describe '#last_payment' do
      context 'payments are loaded' do
        before do
          registration.registration_payments.load
        end

        it 'confirms that payments are loaded' do
          expect(registration.registration_payments.loaded?).to be(true)
        end

        it 'returns last payment' do
          expect(registration.last_payment).to eq(@expected_pmt)
        end

        it 'does not return un-succeeded payments' do
          create(:registration_payment, is_completed: false, registration: registration)
          registration.registration_payments.reload # We have to reload because we've already loaded the records
          expect(registration.last_payment).to eq(@expected_pmt)
        end
      end

      context 'payments are NOT loaded' do
        it 'confirms payments arent loaded' do
          expect(registration.registration_payments.loaded?).to be(false)
        end

        it 'returns last payment' do
          expect(registration.last_payment).to eq(@expected_pmt)
        end

        it 'does not return un-succeeded payments' do
          create(:registration_payment, is_completed: false, registration: registration)
          expect(registration.last_payment).to eq(@expected_pmt)
        end
      end
    end

    describe '#last_positive_payment' do
      it 'returns the latest payment based on paid_on, not created_at or updated_at' do
        expect(registration.last_positive_payment).to eq(@expected_pmt)
      end

      it 'does not return uncaptured payments' do
        create(:registration_payment, is_completed: false, registration: registration)
        expect(registration.last_positive_payment).to eq(@expected_pmt)
      end
    end
  end
end
