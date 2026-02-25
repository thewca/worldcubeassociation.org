# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionsController do
  let(:competition) { create(:competition, :with_delegate, :with_organizer, :registration_open, :with_valid_schedule, :with_guest_limit, :with_meaningless_event_limit, name: "my long competition name above 32 chars 2023") }
  let(:future_competition) { create(:competition, :with_delegate, :ongoing) }

  describe 'GET #show' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the old php page' do
        competition.update_column(:show_at_all, true)
        get :show, params: { id: competition.id }
        expect(response).to have_http_status :ok
        expect(assigns(:competition)).to eq competition
      end

      it '404s when competition is not visible' do
        competition.update_column(:show_at_all, false)

        expect do
          get :show, params: { id: competition.id }
        end.to raise_error(ActionController::RoutingError)
      end
    end
  end

  describe 'GET #new' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :new
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      before { sign_in create :admin }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a delegate' do
      before { sign_in create :delegate }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a regular user' do
      before { sign_in create :user }

      it 'does not allow access' do
        get :new
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'GET #for_senior' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :new
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a senior Delegate' do
      before { sign_in create(:senior_delegate_role).user }

      it 'renders the for_senior page' do
        get :for_senior
        expect(response).to render_template :for_senior
      end
    end

    context 'when signed in as a regular Delegate' do
      before { sign_in create :delegate }

      it 'does not allow access' do
        get :for_senior
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'GET #nearby_competitions' do
    let(:organizer) { create(:user) }
    let(:admin) { create(:admin) }
    let!(:my_competition) { create(:competition, :confirmed, latitude: 10.0, longitude: 10.0, organizers: [organizer], starts: 1.week.ago) }
    let!(:other_competition) do
      create(
        :competition, :with_delegate, :with_valid_schedule, latitude: 10.005, longitude: 10.005, starts: 4.days.ago, registration_close: 5.days.ago
      )
    end

    context 'when signed in as an organizer' do
      before :each do
        sign_in organizer
      end

      it 'cannot see unconfirmed nearby competitions' do
        get :nearby_competitions_json, params: my_competition.serializable_hash
        expect(response.parsed_body).to eq []
        other_competition.organizers = [organizer]
        other_competition.confirmed = true
        other_competition.save!
        get :nearby_competitions_json, params: my_competition.serializable_hash
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json.first["id"]).to eq other_competition.id
      end
    end

    context 'when signed in as an admin' do
      before :each do
        sign_in admin
      end

      it "can see unconfirmed nearby competitions" do
        get :nearby_competitions_json, params: my_competition.serializable_hash
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json.first["id"]).to eq other_competition.id
      end
    end
  end

  describe 'POST #create' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        post :create, params: { competition: { name: "Test2015" } }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      before { sign_in create :user }

      it 'does not allow creation' do
        post :create, params: { competition: { name: "Test2015" } }
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when signed in as an admin' do
      before { sign_in create :admin }

      it "creates a new competition" do
        creation_params = build_competition_update(Competition.new, name: "FatBoyXPC 2015", venue: { countryId: "USA" }, website: { usesWcaRegistration: false })
        post :create, params: creation_params, as: :json
        expect(response).to be_successful
        new_comp = Competition.find("FatBoyXPC2015")
        expect(new_comp.id).to eq "FatBoyXPC2015"
        expect(new_comp.name).to eq "FatBoyXPC 2015"
        expect(new_comp.cell_name).to eq "FatBoyXPC 2015"
      end

      it "creates a competition with correct website when using WCA as competition's website" do
        creation_params = build_competition_update(Competition.new, name: "Awesome Competition 2016", venue: { countryId: "USA" }, website: { generateWebsite: true, usesWcaRegistration: false, externalWebsite: nil })
        post :create, params: creation_params, as: :json
        expect(response).to be_successful
        competition = Competition.find("AwesomeCompetition2016")
        expect(competition.website).to eq competition_url(competition)
      end
    end

    context 'when signed in as a delegate' do
      let(:delegate) { create(:delegate) }

      before :each do
        sign_in delegate
      end

      it 'creates a new competition with organizers and expect them to receive a notification email' do
        organizer = create(:user)
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(delegate, anything, organizer).and_call_original
        creation_params = build_competition_update(Competition.new, name: "Test 2015", venue: { countryId: "USA" }, staff: { staffDelegateIds: [delegate.id], organizerIds: [organizer.id] }, website: { usesWcaRegistration: false })
        expect do
          post :create, params: creation_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
        expect(response).to be_successful
        new_comp = Competition.find("Test2015")
        expect(new_comp.id).to eq "Test2015"
        expect(new_comp.name).to eq "Test 2015"
        expect(new_comp.cell_name).to eq "Test 2015"
      end

      it 'shows an error message under name when creating a competition with a duplicate id' do
        competition = create(:competition, :with_delegate)
        creation_params = build_competition_update(competition, staff: { staffDelegateIds: [delegate.id] }, eventRestrictions: { mainEventId: nil })
        post :create, params: creation_params, as: :json
        expect(response).to have_http_status(:bad_request)
        errors = response.parsed_body
        expect(errors['name']).to eq ["has already been taken"]
      end

      it 'clones a competition' do
        # Set some attributes we don't want cloned.
        competition.update(confirmed: true,
                           results_posted_at: Time.now,
                           show_at_all: true)

        user1 = create(:delegate)
        user2 = create(:user)
        user3 = create(:user)
        competition.delegates << user1
        competition.organizers << user2
        competition.organizers << user3
        get :clone_competition, params: { id: competition }
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq ""
        expect(new_comp.name).to eq ""
        # When cloning a competition, we don't want to clone its show_at_all,
        # confirmed, and results_posted_at attributes.
        expect(new_comp.show_at_all).to be false
        expect(new_comp.confirmed?).to be false
        expect(new_comp.results_posted_at).to be_nil
        # We don't want to clone its dates.
        expect(new_comp.start_date).to be_nil
        expect(new_comp.end_date).to be_nil

        # Cloning a competition should clone its events.
        expect(new_comp.events.sort_by(&:id)).to eq competition.events.sort_by(&:id)

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq competition.organizers.sort_by(&:id)
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq((competition.delegates + [delegate]).sort_by(&:id))
        # Assert competition has guest limit
        expect(competition.guests_per_registration_limit_enabled?).to be true
        # Guest limit is cloned
        expect(new_comp.guests_enabled).to eq competition.guests_enabled
        expect(new_comp.guest_entry_status).to eq competition.guest_entry_status
        expect(new_comp.guests_per_registration_limit).to eq competition.guests_per_registration_limit
        # Source competition has event limit
        expect(competition.events_per_registration_limit_enabled?).to be true
        # Event limit is NOT cloned
        expect(new_comp.event_restrictions).not_to eq competition.event_restrictions
        expect(new_comp.event_restrictions_reason).not_to eq competition.event_restrictions_reason
        expect(new_comp.events_per_registration_limit).not_to eq competition.events_per_registration_limit
      end

      it 'clones a competition that they delegated' do
        # First, make ourselves the delegate of the competition we're going to clone.
        competition.delegates = [delegate]
        get :clone_competition, params: { id: competition }
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq ""

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq competition.organizers.sort_by(&:id)
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq [delegate]
      end
    end
  end

  describe 'POST #update' do
    context 'when signed in as an admin' do
      before { sign_in create :admin }

      it 'can confirm competition' do
        put :confirm, params: { competition_id: competition }
        expect(response).to be_successful
        expect(competition.reload.confirmed?).to be true
      end

      it 'saves staff_delegate_ids' do
        staff_delegates = create_list(:delegate, 2)
        staff_delegate_ids = staff_delegates.map(&:id)
        update_params = build_competition_update(competition, staff: { staffDelegateIds: staff_delegate_ids })
        patch :update, params: update_params, as: :json
        expect(competition.reload.delegates).to eq staff_delegates
      end

      it "saving removes nonexistent delegates" do
        # We use 'insert' here to both: skip validations, and skip callbacks.
        CompetitionDelegate.insert({ competition_id: competition.id, delegate_id: -1, created_at: Time.now, updated_at: Time.now })
        invalid_competition_delegate = CompetitionDelegate.last
        update_params = build_competition_update(competition, name: competition.name)
        patch :update, params: update_params, as: :json
        expect(CompetitionDelegate.find_by(id: invalid_competition_delegate.id)).to be_nil
      end

      it "saving removes nonexistent organizers" do
        CompetitionOrganizer.insert({ competition_id: competition.id, organizer_id: -1, created_at: Time.now, updated_at: Time.now })
        invalid_competition_organizer = CompetitionOrganizer.last
        update_params = build_competition_update(competition, name: competition.name)
        patch :update, params: update_params, as: :json
        expect(CompetitionOrganizer.find_by(id: invalid_competition_organizer.id)).to be_nil
      end

      it "can change competition id" do
        cds = competition.competition_delegates.to_a
        cos = competition.competition_organizers.to_a

        old_id = competition.id
        update_params = build_competition_update(competition, competitionId: "NewId2015", staff: { staffDelegateIds: competition.delegates.map(&:id) })
        patch :update, params: update_params, as: :json

        expect(CompetitionDelegate.where(competition_id: old_id).count).to eq 0
        expect(CompetitionOrganizer.where(competition_id: old_id).count).to eq 0
        expect(CompetitionDelegate.where(competition_id: "NewId2015").map(&:id).sort).to eq cds.map(&:id).sort
        expect(CompetitionOrganizer.where(competition_id: "NewId2015").map(&:id).sort).to eq cos.map(&:id).sort
      end

      it "can change extra registration requirements field after competition is confirmed" do
        comp = create(:competition, :confirmed, :future)
        new_requirements = "New extra requirements"
        update_params = build_competition_update(comp, registration: { extraRequirements: new_requirements })
        patch :update, params: update_params, as: :json
        expect(response).to be_successful
        comp.reload
        expect(comp.extra_registration_requirements).to eq new_requirements
      end
    end

    context 'when signed in as organizer' do
      let(:organizer) { create(:delegate) }

      before :each do
        competition.organizers << organizer
        future_competition.organizers << organizer
        sign_in organizer
      end

      it 'cannot pass a non-delegate as delegate' do
        delegate_ids_old = future_competition.staff_delegate_ids
        fake_delegate = create(:user)
        update_params = build_competition_update(future_competition, staff: { staffDelegateIds: [fake_delegate.id] })
        post :update, params: update_params, as: :json
        expect(response).to have_http_status(:bad_request)
        errors = response.parsed_body
        expect(errors['staff']['staffDelegateIds']).to eq ["are not all Delegates"]
        expect(errors['staff']['traineeDelegateIds']).to eq ["are not all Delegates"]
        future_competition.reload
        expect(future_competition.staff_delegate_ids).to eq delegate_ids_old
      end

      it 'can change the delegate' do
        new_delegate = create(:delegate)
        update_params = build_competition_update(competition, staff: { staffDelegateIds: [new_delegate.id] })
        post :update, params: update_params, as: :json
        competition.reload
        expect(competition.delegates).to eq [new_delegate]
      end

      it 'cannot confirm competition' do
        put :confirm, params: { competition_id: competition }
        expect(response).to have_http_status(:forbidden)
        expect(competition.reload.confirmed?).to be false
      end

      it "who is also the delegate can remove oneself as delegate" do
        # First, make the organizer of the competition the delegate of the competition.
        competition.delegates << organizer
        competition.save!

        # Remove ourself as a delegate. This should be allowed, because we're
        # still an organizer.
        update_params = build_competition_update(competition, staff: { staffDelegateIds: [], organizerIds: [organizer.id] })
        patch :update, params: update_params, as: :json
        expect(response).to be_successful
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq [organizer]
      end

      it "organizer cannot demote oneself" do
        original_organizer = competition.organizers.first
        # Attempt to remove ourself as an organizer. This should not be allowed, because
        # we would not be allowed to access the page anymore.
        update_params = build_competition_update(competition, staff: { organizerIds: [original_organizer.id] })
        patch :update, params: update_params, as: :json
        expect(response).to have_http_status(:bad_request)
        errors = response.parsed_body
        expect(errors['staff']['staffDelegateIds']).to eq ["You cannot demote yourself"]
        expect(errors['staff']['traineeDelegateIds']).to eq ["You cannot demote yourself"]
        expect(errors['staff']['organizerIds']).to eq ["You cannot demote yourself"]
        expect(competition.reload.organizers).to eq [original_organizer, organizer]
      end

      it "can update the registration fees when there is no payment" do
        previous_fees = competition.base_entry_fee_lowest_denomination
        update_params = build_competition_update(competition, entryFees: { baseEntryFee: previous_fees + 10, currencyCode: "EUR" })
        patch :update, params: update_params, as: :json
        expect(response).to be_successful
        competition.reload
        expect(competition.base_entry_fee_lowest_denomination).to eq previous_fees + 10
        expect(competition.currency_code).to eq "EUR"
      end

      it "can update the registration fees when there is any payment" do
        # See https://github.com/thewca/worldcubeassociation.org/issues/2123

        previous_fees = competition.base_entry_fee_lowest_denomination
        create(:registration, :paid, competition: competition)
        update_params = build_competition_update(competition, entryFees: { baseEntryFee: previous_fees + 10, currencyCode: "EUR" })
        patch :update, params: update_params, as: :json
        expect(response).to be_successful
        competition.reload
        expect(competition.base_entry_fee_lowest_denomination).to eq previous_fees + 10
        expect(competition.currency_code).to eq "EUR"
      end
    end

    context "when signed in as board member" do
      let(:board_member) { create(:user, :board_member) }

      before :each do
        sign_in board_member
      end

      it "board member can demote oneself" do
        competition.organizers << board_member
        competition.save!

        # Remove ourself as an organizer. This should be allowed, because we're
        # still able to administer results.
        update_params = build_competition_update(competition, staff: { staffDelegateIds: [], organizerIds: [] }, userSettings: { receiveRegistrationEmails: true })
        patch :update, params: update_params, as: :json
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq []
      end

      it "board member can delete a non-visible competition" do
        competition.update(show_at_all: false)
        delete :destroy, params: { id: competition }
        expect(response).to be_successful
        expect(Competition.find_by(competition_id: competition.id)).to be_nil
      end

      it "board member cannot delete a visible competition" do
        competition.update(show_at_all: true)
        delete :destroy, params: { id: competition }
        expect(response).to have_http_status(:forbidden)
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by(competition_id: competition.id)).not_to be_nil
      end
    end

    context "when signed in as delegate" do
      let(:delegate) { create(:delegate) }
      let(:organizer1) { create(:user) }
      let(:organizer2) { create(:user) }

      before :each do
        competition.delegates << delegate
        sign_in delegate
      end

      it "adds another organizer and expects him to receive a notification email" do
        new_organizer = create(:user)
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(competition.delegates.last, competition, new_organizer).and_call_original
        organizers = [competition.organizers.first, new_organizer]
        update_params = build_competition_update(competition, staff: { organizerIds: organizers.map(&:id) })
        expect do
          patch :update, params: update_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
      end

      it "notifies organizers correctly when id changes" do
        new_organizer = create(:user)
        update_params = build_competition_update(competition, competitionId: "NewId2018", staff: { organizerIds: [competition.organizers.last.id, new_organizer.id] })
        competition.id = "NewId2018"
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(competition.delegates.last, competition, new_organizer).and_call_original
        expect do
          patch :update, params: update_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
      end

      it "removes an organizer and expects him to receive a notification email" do
        competition.organizers << [organizer1, organizer2]
        expect(CompetitionsMailer).to receive(:notify_organizer_of_removal_from_competition).with(competition.delegates.last, competition, organizer2).and_call_original
        update_params = build_competition_update(competition, staff: { organizerIds: [competition.organizers.first.id, organizer1.id] })
        expect do
          patch :update, params: update_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
      end

      it "can confirm a competition and expects wcat and organizers to receive a notification email" do
        competition.update(start_date: 5.weeks.from_now, end_date: 5.weeks.from_now)
        expect(CompetitionsMailer).to receive(:notify_organizer_of_confirmed_competition).with(competition.delegates.last, competition, competition.organizers.last).and_call_original
        expect(CompetitionsMailer).to receive(:notify_wcat_of_confirmed_competition).with(competition.delegates.last, competition).and_call_original
        expect do
          put :confirm, params: { competition_id: competition }
        end.to change(enqueued_jobs, :size).by(2)
        expect(response).to be_successful
        expect(competition.reload.confirmed?).to be true
      end

      it "cannot confirm a competition that is not at least 28 days in the future" do
        competition.update(start_date: 26.days.from_now, end_date: 26.days.from_now)
        put :confirm, params: { competition_id: competition }
        expect(response).to have_http_status(:bad_request)
        expect(competition.reload.confirmed?).to be false
      end

      it "can confirm a competition that is having advancement conditions" do
        competition.update(start_date: 29.days.from_now, end_date: 29.days.from_now)
        competition.competition_events[0].rounds.destroy_all!
        round_one = competition.competition_events[0].rounds.create!(
          format: competition.competition_events[0].event.preferred_formats.first.format,
          number: 1,
          advancement_condition: AdvancementConditions::RankingCondition.new(4),
          total_number_of_rounds: 2,
        )
        round_two = competition.competition_events[0].rounds.create!(
          format: competition.competition_events[0].event.preferred_formats.first.format,
          number: 2,
          total_number_of_rounds: 2,
          scramble_set_count: 1,
        )
        start_time = Time.zone.local_to_utc(competition.start_time)
        end_time = start_time
        room = competition.competition_venues.last.venue_rooms.first.reload
        room.schedule_activities.create!(
          wcif_id: 5,
          name: "Great round",
          round: round_one,
          activity_code: round_one.wcif_id,
          start_time: start_time.change(hour: 10, min: 0, sec: 0).iso8601,
          end_time: end_time.change(hour: 10, min: 30, sec: 0).iso8601,
        )
        room.schedule_activities.create!(
          wcif_id: 6,
          name: "Great round",
          round: round_two,
          activity_code: round_two.wcif_id,
          start_time: start_time.change(hour: 10, min: 30, sec: 0).iso8601,
          end_time: end_time.change(hour: 11, min: 0, sec: 0).iso8601,
        )
        put :confirm, params: { competition_id: competition }
        expect(response).to be_successful
        expect(competition.reload.confirmed?).to be true
      end

      it "cannot confirm a competition that is not having advancement conditions" do
        competition.competition_events[0].rounds.destroy_all!
        competition.competition_events[0].rounds.create!(
          format: competition.competition_events[0].event.preferred_formats.first.format,
          number: 1,
          total_number_of_rounds: 2,
        )
        competition.competition_events[0].rounds.create!(
          format: competition.competition_events[0].event.preferred_formats.first.format,
          number: 2,
          total_number_of_rounds: 2,
          scramble_set_count: 1,
        )
        put :confirm, params: { competition_id: competition }
        expect(competition.reload.confirmed?).to be false
      end

      it "cannot delete not confirmed, but visible competition" do
        competition.update(confirmed: false, show_at_all: true)
        # Attempt to delete competition. This should not work, because we only allow
        # deletion of (not confirmed and not visible) competitions.
        delete :destroy, params: { id: competition }
        expect(response).to have_http_status(:forbidden)
        errors = response.parsed_body
        expect(errors['error']).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by(competition_id: competition.id)).not_to be_nil
      end

      it "cannot delete confirmed competition" do
        competition.update(confirmed: true, show_at_all: false)
        # Attempt to delete competition. This should not work, because we only let
        # delegates deleting unconfirmed competitions.
        delete :destroy, params: { id: competition }
        expect(response).to have_http_status(:forbidden)
        errors = response.parsed_body
        expect(errors['error']).to eq "Cannot delete a confirmed competition."
        expect(Competition.find_by(competition_id: competition.id)).not_to be_nil
      end

      it "can delete not confirmed and not visible competition" do
        competition.update(confirmed: false, show_at_all: false)
        # Attempt to delete competition. This should work, because we allow
        # deletion of (not confirmed and not visible) competitions.
        delete :destroy, params: { id: competition }
        expect(Competition.find_by(competition_id: competition.id)).to be_nil
        expect(response).to be_successful
      end

      it "cannot change registration open/close of locked competition" do
        old_open = 2.days.from_now.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 27.days.from_now.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        new_open = 1.week.from_now.change(sec: 0)
        new_close = 2.weeks.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { openingDateTime: new_open, closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "can extend registration close of locked competition when deadline hasn't passed" do
        old_open = 2.days.from_now.change(sec: 0)
        old_close = 20.days.from_now.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        new_close = 27.days.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq new_close
      end

      it "cannot shorten registration close of locked competition when deadline hasn't passed" do
        old_open = 2.days.from_now.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 27.days.from_now.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        # This is definitely less than the 27 days above, no matter which month
        new_close = 2.weeks.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "cannot change registration close of locked competition when deadline has passed" do
        old_open = 27.days.ago.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 2.days.ago.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        new_close = 2.weeks.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "can change extra registration requirements field before competition is confirmed" do
        new_requirements = "New extra requirements"
        update_params = build_competition_update(competition, registration: { extraRequirements: new_requirements })
        patch :update, params: update_params, as: :json
        competition.reload
        expect(competition.extra_registration_requirements).to eq new_requirements
      end

      it "cannot change extra registration requirements field after competition is confirmed" do
        comp = create(:competition, :confirmed, delegates: [delegate], extra_registration_requirements: "Extra requirements")
        new_requirements = "New extra requirements"
        update_params = build_competition_update(comp, registration: { extraRequirements: new_requirements })
        patch :update, params: update_params, as: :json
        comp.reload
        expect(comp.extra_registration_requirements).to eq "Extra requirements"
      end

      it "can change general information field before competition is confirmed" do
        new_information = "New information"
        update_params = build_competition_update(competition, information: new_information)
        patch :update, params: update_params, as: :json
        competition.reload
        expect(competition.information).to eq new_information
      end

      it "can change general information field even after competition is confirmed" do
        comp = create(:competition, :confirmed, :registration_open, delegates: [delegate], information: "Old information")
        new_information = "New information"
        update_params = build_competition_update(comp, information: new_information)
        patch :update, params: update_params, as: :json
        comp.reload
        expect(comp.information).to eq new_information
      end

      it "can extend edit events deadline of locked competition when original deadline hasn't passed" do
        old_deadline = competition.start_date.to_datetime - 3.days
        competition.update(confirmed: true, event_change_deadline_date: old_deadline)

        new_deadline = competition.start_date.to_datetime - 1.day
        update_params = build_competition_update(competition, registration: { eventChangeDeadlineDate: new_deadline })
        patch :update, params: update_params, as: :json
        expect(competition.reload.event_change_deadline_date).to eq new_deadline
      end

      it "can change edit events deadline of locked competition even when deadline has passed" do
        old_open = 27.days.ago.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 2.days.ago.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close, event_change_deadline_date: old_close.to_datetime)

        new_deadline = competition.start_date.to_datetime
        update_params = build_competition_update(competition, registration: { eventChangeDeadlineDate: new_deadline })
        patch :update, params: update_params, as: :json
        expect(competition.reload.event_change_deadline_date).to eq new_deadline
      end

      it "can remove edit events deadline of locked competition even when deadline has passed" do
        old_open = 27.days.ago.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 2.days.ago.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close, event_change_deadline_date: old_close.to_datetime)

        update_params = build_competition_update(competition, registration: { eventChangeDeadlineDate: '' })
        patch :update, params: update_params, as: :json
        expect(competition.reload.event_change_deadline_date).to be_nil
      end

      it "cannot shorten edit events deadline of locked competition when deadline hasn't passed" do
        old_deadline = competition.start_date.to_datetime - 3.days
        competition.update(confirmed: true, event_change_deadline_date: old_deadline)

        new_close = competition.start_date.to_datetime - 5.days
        update_params = build_competition_update(competition, registration: { eventChangeDeadlineDate: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.event_change_deadline_date).to eq old_deadline
      end
    end

    context "when signed in as a trainee delegate" do
      let(:delegate) { create(:delegate) }
      let(:trainee_delegate) { create(:trainee_delegate) }
      let(:organizer1) { create(:user) }
      let(:organizer2) { create(:user) }

      before :each do
        competition.delegates << delegate
        competition.delegates << trainee_delegate
        sign_in trainee_delegate
      end

      it "adds another organizer and expects him to receive a notification email" do
        new_organizer = create(:user)
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(competition.trainee_delegates.last, competition, new_organizer).and_call_original
        organizers = [competition.organizers.first, new_organizer]
        update_params = build_competition_update(competition, staff: { organizerIds: organizers.map(&:id) })
        expect do
          patch :update, params: update_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
      end

      it "notifies organizers correctly when id changes" do
        new_organizer = create(:user)
        update_params = build_competition_update(competition, competitionId: "NewId2018", staff: { organizerIds: [competition.organizers.last.id, new_organizer.id] })
        competition.id = "NewId2018"
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(competition.trainee_delegates.last, competition, new_organizer).and_call_original
        expect do
          patch :update, params: update_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
      end

      it "removes an organizer and expects him to receive a notification email" do
        competition.organizers << [organizer1, organizer2]
        expect(CompetitionsMailer).to receive(:notify_organizer_of_removal_from_competition).with(competition.trainee_delegates.last, competition, organizer2).and_call_original
        update_params = build_competition_update(competition, staff: { organizerIds: [competition.organizers.first.id, organizer1.id] })
        expect do
          patch :update, params: update_params, as: :json
        end.to change(enqueued_jobs, :size).by(1)
      end

      it "cannot confirm a competition" do
        competition.organizers << organizer1
        competition.update(start_date: 5.weeks.from_now, end_date: 5.weeks.from_now)
        put :confirm, params: { competition_id: competition }
        expect(response).to have_http_status(:forbidden)
        expect(competition.reload.confirmed?).to be false
      end

      it "cannot delete not confirmed, but visible competition" do
        competition.update(confirmed: false, show_at_all: true)
        # Attempt to delete competition. This should not work, because we only allow
        # deletion of (not confirmed and not visible) competitions.
        delete :destroy, params: { id: competition }
        expect(response).to have_http_status(:forbidden)
        errors = response.parsed_body
        expect(errors['error']).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by(competition_id: competition.id)).not_to be_nil
      end

      it "cannot delete confirmed competition" do
        competition.update(confirmed: true, show_at_all: false)
        # Attempt to delete competition. This should not work, because we only let
        # delegates deleting unconfirmed competitions.
        delete :destroy, params: { id: competition }
        expect(response).to have_http_status(:forbidden)
        errors = response.parsed_body
        expect(errors['error']).to eq "Cannot delete a confirmed competition."
        expect(Competition.find_by(competition_id: competition.id)).not_to be_nil
      end

      it "can delete not confirmed and not visible competition" do
        competition.update(confirmed: false, show_at_all: false)
        # Attempt to delete competition. This should work, because we allow
        # deletion of (not confirmed and not visible) competitions.
        delete :destroy, params: { id: competition }
        expect(Competition.find_by(competition_id: competition.id)).to be_nil
        expect(response).to be_successful
      end

      it "cannot change registration open/close of locked competition" do
        old_open = 2.days.from_now.change(sec: 0)
        # see comment in regular "when signed in as delegate" context
        old_close = 27.days.from_now.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        new_open = 1.week.from_now.change(sec: 0)
        new_close = 2.weeks.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { openingDateTime: new_open, closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "can extend registration close of locked competition when deadline hasn't passed" do
        old_open = 2.days.from_now.change(sec: 0)
        old_close = 20.days.from_now.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        new_close = 27.days.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq new_close
      end

      it "cannot shorten registration close of locked competition when deadline hasn't passed" do
        old_open = 2.days.from_now.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 27.days.from_now.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        # This is definitely less than the 27 days above, no matter which month
        new_close = 2.weeks.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "cannot change registration close of locked competition when deadline has passed" do
        old_open = 27.days.ago.change(sec: 0)
        # respect the fact that February can have exactly 4 weeks
        # which is potentially colliding with the start_date set in the competition spec factory
        old_close = 2.days.ago.change(sec: 0)
        competition.update(confirmed: true, registration_open: old_open, registration_close: old_close)

        new_close = 2.weeks.from_now.change(sec: 0)
        update_params = build_competition_update(competition, registration: { closingDateTime: new_close })
        patch :update, params: update_params, as: :json
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "can change extra registration requirements field before competition is confirmed" do
        new_requirements = "New extra requirements"
        update_params = build_competition_update(competition, registration: { extraRequirements: new_requirements })
        patch :update, params: update_params, as: :json
        competition.reload
        expect(competition.extra_registration_requirements).to eq new_requirements
      end

      it "cannot change extra registration requirements field after competition is confirmed" do
        comp = create(:competition, :confirmed, :registration_open, delegates: [delegate, trainee_delegate], extra_registration_requirements: "Extra requirements")
        new_requirements = "New extra requirements"
        update_params = build_competition_update(comp, registration: { extraRequirements: new_requirements })
        patch :update, params: update_params, as: :json
        comp.reload
        expect(comp.extra_registration_requirements).to eq "Extra requirements"
      end

      it "can change general information field before competition is confirmed" do
        new_information = "New information"
        update_params = build_competition_update(competition, information: new_information)
        patch :update, params: update_params, as: :json
        competition.reload
        expect(competition.information).to eq new_information
      end

      it "can change general information field even after competition is confirmed" do
        comp = create(:competition, :confirmed, :registration_open, delegates: [delegate, trainee_delegate], information: "Old information")
        new_information = "New information"
        update_params = build_competition_update(comp, information: new_information)
        patch :update, params: update_params, as: :json
        comp.reload
        expect(comp.information).to eq new_information
      end
    end

    context "when signed in as delegate for a different competition" do
      let(:delegate) { create(:delegate) }

      before :each do
        sign_in delegate
      end

      it "cannot delete competition they are not delegating" do
        competition.update(confirmed: false, show_at_all: true)
        # Attempt to delete competition. This should not work, because we're
        # not the delegate for this competition.
        delete :destroy, params: { id: competition }
        expect(Competition.find_by(competition_id: competition.id)).not_to be_nil
      end
    end
  end

  describe 'GET #post_announcement' do
    context 'when signed in as competition announcement team member' do
      let(:wcat_member) { create(:user, :wcat_member) }

      it 'announces and expects organizers to receive a notification email' do
        sign_in wcat_member
        competition.update(start_date: "2011-12-04", end_date: "2011-12-05")
        expect(competition.announced_at).to be_nil
        expect(competition.announced_by).to be_nil
        expect(CompetitionsMailer).to receive(:notify_organizer_of_announced_competition).with(competition, competition.organizers.last).and_call_original
        expect do
          put :announce, params: { competition_id: competition }
        end.to change(enqueued_jobs, :size).by(1)
        competition.reload
        expect(competition.announced_at.to_f).to be < Time.now.to_f
        expect(competition.announced_by).to eq wcat_member.id
      end
    end
  end

  describe 'PUT #cancel_or_uncancel' do
    let(:competition) { create(:competition, :confirmed, :announced, :future) }

    context 'when signed in as WCAT' do
      let(:wcat_member) { create(:user, :wcat_member) }

      before :each do
        sign_in wcat_member
      end

      it "cannot cancel unconfirmed competition" do
        comp = create(:competition, :announced)
        put :cancel_or_uncancel, params: { competition_id: comp }
        expect(response).to have_http_status(:bad_request)
        expect(comp.reload.cancelled?).to be false
      end

      it "cannot cancel unannounced competition" do
        comp = create(:competition, :confirmed)
        put :cancel_or_uncancel, params: { competition_id: comp }
        expect(response).to have_http_status(:bad_request)
        expect(comp.reload.cancelled?).to be false
      end

      it "can cancel competition" do
        put :cancel_or_uncancel, params: { competition_id: competition }
        expect(response).to be_successful
        expect(competition.reload.cancelled?).to be true
      end

      it "can uncancel competition" do
        cancelled_competition = create(:competition, :cancelled, :future)
        put :cancel_or_uncancel, params: { competition_id: cancelled_competition, undo: true }
        expect(response).to be_successful
        expect(cancelled_competition.reload.cancelled?).to be false
      end
    end

    context 'when signed in as orga' do
      let(:orga) { create(:user) }

      before :each do
        sign_in orga
      end

      it 'cannot cancel competition' do
        competition.organizers << orga
        put :cancel_or_uncancel, params: { competition_id: competition }
        expect(response).to have_http_status(:forbidden)
        expect(competition.reload.cancelled?).to be false
      end

      it 'cannot uncancel competition' do
        cancelled_competition = create(:competition, :cancelled, organizers: [orga])
        put :cancel_or_uncancel, params: { competition_id: cancelled_competition }
        expect(response).to have_http_status(:forbidden)
        expect(cancelled_competition.reload.cancelled?).to be true
      end
    end
  end

  describe 'POST #orga_close_reg_when_full_limit' do
    context 'organiser trying to close registration via button' do
      let(:orga) { create(:user) }

      before :each do
        sign_in orga
      end

      it "can close registration with full limit" do
        comp_with_full_reg = create(:competition, :registration_open, competitor_limit_enabled: true, competitor_limit: 1, competitor_limit_reason: "we have a tiny venue")
        comp_with_full_reg.organizers << orga
        create(:registration, :accepted, :newcomer, competition: comp_with_full_reg)
        put :close_full_registration, params: { competition_id: comp_with_full_reg }
        expect(response).to be_successful
        expect(comp_with_full_reg.reload.registration_close).to be < Time.now
      end

      it "cannot close registration non full limit" do
        comp_without_full_reg = create(:competition, :registration_open, competitor_limit_enabled: true, competitor_limit: 100, competitor_limit_reason: "venue size")
        comp_without_full_reg.organizers << orga
        create(:registration, :pending, :newcomer, competition: comp_without_full_reg)
        create(:registration, :accepted, :newcomer, competition: comp_without_full_reg)
        put :close_full_registration, params: { competition_id: comp_without_full_reg }
        expect(response).to have_http_status(:bad_request)
        expect(comp_without_full_reg.reload.registration_close).to be > Time.now
      end
    end

    context 'regular user trying to close registration via button' do
      before { sign_in create :user }

      it 'does not allow regular user to use organiser reg close button' do
        comp_with_full_reg = create(:competition, :registration_open, competitor_limit_enabled: true, competitor_limit: 1, competitor_limit_reason: "we have a tiny venue")
        create(:registration, :accepted, :newcomer, competition: comp_with_full_reg)
        expect do
          put :close_full_registration, params: { competition_id: comp_with_full_reg }
        end.to raise_error(ActionController::RoutingError)
        expect(comp_with_full_reg.reload.registration_close).to be > Time.now
      end
    end
  end

  describe 'GET #my_competitions', :clean_db_with_truncation do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :my_competitions
        expect(response).to redirect_to new_user_session_path
      end
    end
  end

  describe 'POST #bookmark' do
    let!(:user) { create(:user) }
    let!(:competition) { create(:competition, :visible) }

    context 'when signed in' do
      before do
        sign_in user
      end

      it 'bookmarks a competition' do
        expect(user.competition_bookmarked?(competition)).to be false
        post :bookmark, params: { id: competition.id }
        expect(user.competition_bookmarked?(competition)).to be true
      end

      it 'unbookmarks a competition' do
        post :bookmark, params: { id: competition.id }
        expect(user.competition_bookmarked?(competition)).to be true
        post :unbookmark, params: { id: competition.id }
        expect(user.competition_bookmarked?(competition)).to be false
      end
    end
  end

  describe 'GET #edit_events' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :edit_events, params: { id: competition.id }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      before { sign_in create :admin }

      it 'shows the edit competition events form' do
        get :edit_events, params: { id: competition.id }
        expect(response).to render_template :edit_events
      end
    end

    context 'when signed in as a regular user' do
      before { sign_in create :user }

      it 'does not allow access' do
        expect do
          get :edit_events, params: { id: competition.id }
        end.to raise_error(ActionController::RoutingError)
      end
    end
  end

  describe 'GET #payment_integration_setup' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :payment_integration_setup, params: { competition_id: competition }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      before { sign_in create :admin }

      it 'displays payment setup status' do
        get :payment_integration_setup, params: { competition_id: competition }
        expect(response).to have_http_status :ok
        expect(assigns(:competition)).to eq competition
      end
    end

    context 'when signed in as a regular user' do
      before { sign_in create :user }

      it 'does not allow access' do
        expect do
          get :payment_integration_setup, params: { competition_id: competition }
        end.to raise_error(ActionController::RoutingError)
      end
    end
  end

  describe 'GET #stripe_connect' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :stripe_connect, params: { state: competition }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      before { sign_in create :user }

      it 'does not allow access' do
        expect do
          get :stripe_connect, params: { state: competition }
        end.to raise_error(ActionController::RoutingError)
      end
    end
  end

  describe 'GET #edit_schedule' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :edit_schedule, params: { id: competition }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      before { sign_in create :user }

      it 'does not allow access' do
        expect do
          get :edit_schedule, params: { id: competition }
        end.to raise_error(ActionController::RoutingError)
      end
    end

    context 'when signed in as a competition delegate' do
      before do
        sign_in competition.delegates.first
      end

      it 'displays the page' do
        # NOTE: we test the javascript part renders in the feature spec!
        get :edit_schedule, params: { id: competition }
        expect(response).to have_http_status :ok
        expect(assigns(:competition)).to eq competition
      end
    end
  end
end

def build_competition_update(comp, **override_params)
  comp.to_form_data.deep_symbolize_keys.merge({ id: comp.id }).deep_merge(override_params)
end
