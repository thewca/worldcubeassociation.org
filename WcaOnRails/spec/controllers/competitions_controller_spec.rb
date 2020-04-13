# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionsController do
  let(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open, :with_valid_schedule) }
  let(:future_competition) { FactoryBot.create(:competition, :with_delegate, :ongoing) }

  describe 'GET #index' do
    describe "selecting events" do
      let!(:competition1) { FactoryBot.create(:competition, :confirmed, :visible, starts: 1.week.from_now, events: Event.where(id: %w(222 333 444 555 666))) }
      let!(:competition2) { FactoryBot.create(:competition, :confirmed, :visible, starts: 2.week.from_now, events: Event.where(id: %w(333 444 555 pyram clock))) }
      let!(:competition3) { FactoryBot.create(:competition, :confirmed, :visible, starts: 3.week.from_now, events: Event.where(id: %w(222 333 skewb 666 pyram sq1))) }
      let!(:competition4) { FactoryBot.create(:competition, :confirmed, :visible, starts: 4.week.from_now, events: Event.where(id: %w(333 pyram 666 777 clock))) }

      context "when no event is selected" do
        it "competitions are sorted by start date" do
          get :index
          expect(assigns(:competitions)).to eq [competition1, competition2, competition3, competition4]
        end
      end

      context "when events are selected" do
        it "only competitions matching all of the selected events are shown" do
          get :index, params: { event_ids: %w(333 pyram clock) }
          expect(assigns(:competitions)).to eq [competition2, competition4]
        end

        it "competitions are still sorted by start date" do
          get :index, params: { event_ids: ["333"] }
          expect(assigns(:competitions)).to eq [competition1, competition2, competition3, competition4]
        end

        # See: https://github.com/thewca/worldcubeassociation.org/issues/472
        it "works when event_ids are passed as a hash instead of an array (facebook redirection)" do
          get :index, params: { event_ids: { "0" => "333", "1" => "pyram", "2" => "clock" } }
          expect(assigns(:competitions)).to eq [competition2, competition4]
        end
      end
    end

    describe "selecting present/past/recent/by_announcement/custom competitions" do
      let!(:past_comp1) { FactoryBot.create(:competition, :confirmed, :visible, starts: 1.year.ago) }
      let!(:past_comp2) { FactoryBot.create(:competition, :confirmed, :visible, starts: 3.years.ago) }
      let!(:in_progress_comp1) { FactoryBot.create(:competition, :confirmed, :visible, starts: Date.today, ends: 1.day.from_now) }
      let!(:in_progress_comp2) { FactoryBot.create(:competition, :confirmed, :visible, starts: Date.today, ends: Date.today) }
      let!(:upcoming_comp1) { FactoryBot.create(:competition, :confirmed, :visible, starts: 2.weeks.from_now) }
      let!(:upcoming_comp2) { FactoryBot.create(:competition, :confirmed, :visible, starts: 3.weeks.from_now) }

      context "when present is selected" do
        before do
          get :index, params: { state: :present }
        end

        it "shows only competitions being in progress or upcoming" do
          expect(assigns(:competitions)).to match_array [in_progress_comp1, in_progress_comp2, upcoming_comp1, upcoming_comp2]
        end

        it "upcoming competitions are sorted ascending by date" do
          expect(assigns(:competitions).last(2)).to eq [upcoming_comp1, upcoming_comp2]
        end
      end

      context "when past is selected" do
        it "when all years are selected, shows all past competitions" do
          get :index, params: { state: :past, year: "all years" }
          expect(assigns(:competitions)).to match [past_comp1, past_comp2]
        end

        it "when a single year is selected, shows past competitions from this year" do
          get :index, params: { state: :past, year: past_comp1.year }
          expect(assigns(:competitions)).to eq [past_comp1]
        end

        it "competitions are sorted descending by date" do
          get :index, params: { state: :past, year: "all years" }
          expect(assigns(:competitions)).to eq [past_comp1, past_comp2]
        end
      end

      context "when recent is selected" do
        before do
          get :index, params: { state: :recent }
        end

        it "shows in progress competition that ends today" do
          expect(assigns(:competitions)).to match_array [in_progress_comp2]
        end
      end

      context "when by_announcement is selected" do
        before do
          get :index, params: { state: :by_announcement }
          upcoming_comp1.update_column(:announced_at, 2.month.ago)
          upcoming_comp2.update_column(:announced_at, 1.month.ago)
        end

        it "competitions are sorted by announcement_date" do
          expect(assigns(:competitions).first(2)).to eq [upcoming_comp2, upcoming_comp1]
        end
      end

      context "when custom is selected" do
        before do
          get :index, params: { state: :custom, from_date: 1.day.from_now, to_date: 2.weeks.from_now }
        end

        it "shows competitions overlapping the given date range" do
          expect(assigns(:competitions)).to match_array [in_progress_comp1, upcoming_comp1]
        end
      end
    end
  end

  describe 'GET #show' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the old php page' do
        competition.update_column(:showAtAll, true)
        get :show, params: { id: competition.id }
        expect(response.status).to eq 200
        expect(assigns(:competition)).to eq competition
      end

      it '404s when competition is not visible' do
        competition.update_column(:showAtAll, false)

        expect {
          get :show, params: { id: competition.id }
        }.to raise_error(ActionController::RoutingError)
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
      sign_in { FactoryBot.create :admin }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a delegate' do
      sign_in { FactoryBot.create :delegate }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryBot.create :user }

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
      sign_in { FactoryBot.create :senior_delegate }

      it 'renders the for_senior page' do
        get :for_senior
        expect(response).to render_template :for_senior
      end
    end

    context 'when signed in as a regular Delegate' do
      sign_in { FactoryBot.create :delegate }

      it 'does not allow access' do
        get :for_senior
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'GET #edit' do
    let(:organizer) { FactoryBot.create(:user) }
    let(:admin) { FactoryBot.create :admin }
    let!(:my_competition) { FactoryBot.create(:competition, :confirmed, latitude: 10.0, longitude: 10.0, organizers: [organizer], starts: 1.week.ago) }
    let!(:other_competition) { FactoryBot.create(:competition, :with_delegate, :with_valid_schedule, latitude: 11.0, longitude: 11.0, starts: 1.day.ago) }

    context 'when signed in as an organizer' do
      before :each do
        sign_in organizer
      end

      it 'cannot see unconfirmed nearby competitions' do
        get :edit, params: { id: my_competition }
        expect(assigns(:nearby_competitions)).to eq []
        other_competition.confirmed = true
        other_competition.save!
        get :edit, params: { id: my_competition }
        expect(assigns(:nearby_competitions)).to eq [other_competition]
      end
    end

    context 'when signed in as an admin' do
      before :each do
        sign_in admin
      end

      it "can see unconfirmed nearby competitions" do
        get :edit, params: { id: my_competition }
        expect(assigns(:nearby_competitions)).to eq [other_competition]
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
      sign_in { FactoryBot.create :user }
      it 'does not allow creation' do
        post :create, params: { competition: { name: "Test2015" } }
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryBot.create :admin }

      it "creates a new competition" do
        post :create, params: { competition: { name: "FatBoyXPC 2015", use_wca_registration: false } }
        new_comp = assigns(:competition)
        expect(response).to redirect_to edit_competition_path("FatBoyXPC2015")
        expect(new_comp.id).to eq "FatBoyXPC2015"
        expect(new_comp.name).to eq "FatBoyXPC 2015"
        expect(new_comp.cellName).to eq "FatBoyXPC 2015"
      end

      it "creates a competition with correct website when using WCA as competition's website" do
        post :create, params: { competition: { name: "Awesome Competition 2016", external_website: nil, generate_website: "1", use_wca_registration: false } }
        competition = assigns(:competition)
        expect(competition.website).to eq competition_url(competition)
      end
    end

    context 'when signed in as a delegate' do
      let(:delegate) { FactoryBot.create :delegate }
      before :each do
        sign_in delegate
      end

      it 'creates a new competition with organizers and expect them to receive a notification email' do
        organizer = FactoryBot.create :user
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(delegate, anything, organizer).and_call_original
        expect do
          post :create, params: { competition: { name: "Test 2015", delegate_ids: delegate.id, organizer_ids: organizer.id, use_wca_registration: false } }
        end.to change { enqueued_jobs.size }.by(1)
        expect(response).to redirect_to edit_competition_path("Test2015")
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "Test2015"
        expect(new_comp.name).to eq "Test 2015"
        expect(new_comp.cellName).to eq "Test 2015"
      end

      it 'shows an error message under name when creating a competition with a duplicate id' do
        competition = FactoryBot.create :competition, :with_delegate
        post :create, params: { competition: { name: competition.name } }
        expect(response).to render_template(:new)
        new_comp = assigns(:competition)
        expect(new_comp.errors.messages[:name]).to eq ["has already been taken"]
      end

      it 'clones a competition' do
        # Set some attributes we don't want cloned.
        competition.update_attributes(confirmed: true,
                                      results_posted_at: Time.now,
                                      showAtAll: true)

        user1 = FactoryBot.create(:delegate)
        user2 = FactoryBot.create(:user)
        user3 = FactoryBot.create(:user)
        competition.delegates << user1
        competition.organizers << user2
        competition.organizers << user3
        get :clone_competition, params: { id: competition }
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq ""
        expect(new_comp.name).to eq ""
        # When cloning a competition, we don't want to clone its showAtAll,
        # confirmed, and results_posted_at attributes.
        expect(new_comp.showAtAll).to eq false
        expect(new_comp.confirmed?).to eq false
        expect(new_comp.results_posted_at).to eq nil
        # We don't want to clone its dates.
        %w(year month day endYear endMonth endDay).each do |attribute|
          expect(new_comp.send(attribute)).to eq 0
        end

        # Cloning a competition should clone its events.
        expect(new_comp.events.sort_by(&:id)).to eq competition.events.sort_by(&:id)

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq competition.organizers.sort_by(&:id)
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq((competition.delegates + [delegate]).sort_by(&:id))
      end

      it 'clones a competition that they delegated' do
        # First, make ourselves the delegate of the competition we're going to clone.
        competition.delegates = [delegate]
        get :clone_competition, params: { id: competition }
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq ""

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq []
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq [delegate]
      end
    end
  end

  describe 'POST #update' do
    context 'when signed in as an admin' do
      sign_in { FactoryBot.create :admin }

      it 'redirects organizer view to organizer view' do
        patch :update, params: { id: competition, competition: { name: competition.name } }
        expect(response).to redirect_to edit_competition_path(competition)
      end

      it 'redirects admin view to admin view' do
        patch :update, params: { id: competition, competition: { name: competition.name }, competition_admin_view: true }
        expect(response).to redirect_to admin_edit_competition_path(competition)
      end

      it 'renders admin view when failing to save admin view' do
        patch :update, params: { id: competition, competition: { name: "fooo" }, competition_admin_view: true }
        expect(response).to render_template :edit
        competition_admin_view = assigns(:competition_admin_view)
        expect(competition_admin_view).to be true
      end

      it 'can confirm competition' do
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Confirm" }
        expect(response).to redirect_to edit_competition_path(competition)
        expect(competition.reload.confirmed?).to eq true
      end

      it 'saves delegate_ids' do
        delegate1 = FactoryBot.create(:delegate)
        delegate2 = FactoryBot.create(:delegate)
        delegates = [delegate1, delegate2]
        delegate_ids = delegates.map(&:id).join(",")
        patch :update, params: { id: competition, competition: { delegate_ids: delegate_ids } }
        expect(competition.reload.delegates).to eq delegates
      end

      it "saving removes nonexistent delegates" do
        invalid_competition_delegate = CompetitionDelegate.new(competition_id: competition.id, delegate_id: -1)
        invalid_competition_delegate.save(validate: false)
        patch :update, params: { id: competition, competition: { name: competition.name } }
        expect(CompetitionDelegate.find_by_id(invalid_competition_delegate.id)).to be_nil
      end

      it "saving removes nonexistent organizers" do
        invalid_competition_organizer = CompetitionOrganizer.new(competition_id: competition.id, organizer_id: -1)
        invalid_competition_organizer.save(validate: false)
        patch :update, params: { id: competition, competition: { name: competition.name } }
        expect(CompetitionOrganizer.find_by_id(invalid_competition_organizer.id)).to be_nil
      end

      it "can change competition id" do
        cds = competition.competition_delegates.to_a
        cos = competition.competition_organizers.to_a

        old_id = competition.id
        patch :update, params: { id: competition, competition: { id: "NewId2015", delegate_ids: competition.delegates.map(&:id).join(",") } }

        expect(CompetitionDelegate.where(competition_id: old_id).count).to eq 0
        expect(CompetitionOrganizer.where(competition_id: old_id).count).to eq 0
        expect(CompetitionDelegate.where(competition_id: "NewId2015").map(&:id).sort).to eq cds.map(&:id).sort
        expect(CompetitionOrganizer.where(competition_id: "NewId2015").map(&:id).sort).to eq cos.map(&:id).sort
      end

      it "can change extra registration requirements field after competition is confirmed" do
        comp = FactoryBot.create(:competition, :confirmed)
        new_requirements = "New extra requirements"
        patch :update, params: { id: comp, competition: { extra_registration_requirements: new_requirements } }
        comp.reload
        expect(comp.extra_registration_requirements).to eq new_requirements
      end
    end

    context 'when signed in as organizer' do
      let(:organizer) { FactoryBot.create(:delegate) }
      before :each do
        competition.organizers << organizer
        future_competition.organizers << organizer
        sign_in organizer
      end

      it 'cannot pass a non-delegate as delegate' do
        delegate_ids_old = future_competition.delegate_ids
        fake_delegate = FactoryBot.create(:user)
        post :update, params: { id: future_competition, competition: { delegate_ids: fake_delegate.id } }
        invalid_competition = assigns(:competition)
        expect(invalid_competition.errors.messages[:delegate_ids]).to eq ["are not all Delegates"]
        future_competition.reload
        expect(future_competition.delegate_ids).to eq delegate_ids_old
      end

      it 'can change the delegate' do
        new_delegate = FactoryBot.create(:delegate)
        post :update, params: { id: competition, competition: { delegate_ids: new_delegate.id } }
        competition.reload
        expect(competition.delegates).to eq [new_delegate]
      end

      it 'cannot confirm competition' do
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Confirm" }
        expect(response.status).to redirect_to edit_competition_path(competition)
        expect(competition.reload.confirmed?).to eq false
      end

      it "who is also the delegate can remove oneself as delegate" do
        # First, make the organizer of the competition the delegate of the competition.
        competition.delegates << organizer
        competition.save!

        # Remove ourself as a delegate. This should be allowed, because we're
        # still an organizer.
        patch :update, params: { id: competition, competition: { delegate_ids: "", organizer_ids: organizer.id } }
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq [organizer]
      end

      it "organizer cannot demote oneself" do
        # Attempt to remove ourself as an organizer. This should not be allowed, because
        # we would not be allowed to access the page anymore.
        patch :update, params: { id: competition, competition: { organizer_ids: "" } }
        invalid_competition = assigns(:competition)
        expect(invalid_competition).to be_invalid
        expect(invalid_competition.organizer_ids).to eq ""
        expect(invalid_competition.errors.messages[:delegate_ids]).to eq ["You cannot demote yourself"]
        expect(invalid_competition.errors.messages[:organizer_ids]).to eq ["You cannot demote yourself"]
        expect(competition.reload.organizers).to eq [organizer]
      end

      it "can update the registration fees when there is no payment" do
        previous_fees = competition.base_entry_fee_lowest_denomination
        patch :update, params: { id: competition, competition: { base_entry_fee_lowest_denomination: previous_fees + 10, currency_code: "EUR" } }
        competition.reload
        expect(competition.base_entry_fee_lowest_denomination).to eq previous_fees + 10
        expect(competition.currency_code).to eq "EUR"
      end

      it "can update the registration fees when there is any payment" do
        # See https://github.com/thewca/worldcubeassociation.org/issues/2123

        previous_fees = competition.base_entry_fee_lowest_denomination
        FactoryBot.create(:registration, :paid, competition: competition)
        patch :update, params: { id: competition, competition: { base_entry_fee_lowest_denomination: previous_fees + 10, currency_code: "EUR" } }
        competition.reload
        expect(competition.base_entry_fee_lowest_denomination).to eq previous_fees + 10
        expect(competition.currency_code).to eq "EUR"
      end
    end

    context "when signed in as board member" do
      let(:board_member) { FactoryBot.create(:user, :board_member) }

      before :each do
        sign_in board_member
      end

      it "board member can demote oneself" do
        competition.organizers << board_member
        competition.save!

        # Remove ourself as an organizer. This should be allowed, because we're
        # still able to administer results.
        patch :update, params: { id: competition, competition: { delegate_ids: "", organizer_ids: "", receive_registration_emails: true } }
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq []
      end

      it "board member can delete a non-visible competition" do
        competition.update_attributes(showAtAll: false)
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Delete" }
        expect(Competition.find_by_id(competition.id)).to be_nil
      end

      it "board member cannot delete a visible competition" do
        competition.update_attributes(showAtAll: true)
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Delete" }
        expect(flash[:danger]).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end
    end

    context "when signed in as delegate" do
      let(:delegate) { FactoryBot.create(:delegate) }
      let(:organizer1) { FactoryBot.create(:user) }
      let(:organizer2) { FactoryBot.create(:user) }
      before :each do
        competition.delegates << delegate
        sign_in delegate
      end

      it "adds another organizer and expects him to receive a notification email" do
        competition.organizers << organizer1
        new_organizer = FactoryBot.create :user
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(competition.delegates.last, competition, new_organizer).and_call_original
        organizers = [competition.organizers.first, new_organizer]
        organizer_ids = organizers.map(&:id).join(",")
        expect do
          patch :update, params: { id: competition, competition: { organizer_ids: organizer_ids } }
        end.to change { enqueued_jobs.size }.by(1)
      end

      it "notifies organizers correctly when id changes" do
        new_organizer = FactoryBot.create :user
        old_id = competition.id
        competition.id = "NewId2018"
        expect(CompetitionsMailer).to receive(:notify_organizer_of_addition_to_competition).with(competition.delegates.last, competition, new_organizer).and_call_original
        expect do
          patch :update, params: { id: old_id, competition: { id: "NewId2018", organizer_ids: new_organizer.id } }
        end.to change { enqueued_jobs.size }.by(1)
      end

      it "removes an organizer and expects him to receive a notification email" do
        competition.organizers << [organizer1, organizer2]
        expect(CompetitionsMailer).to receive(:notify_organizer_of_removal_from_competition).with(competition.delegates.last, competition, organizer2).and_call_original
        expect do
          patch :update, params: { id: competition, competition: { organizer_ids: organizer1.id } }
        end.to change { enqueued_jobs.size }.by(1)
      end

      it "can confirm a competition and expects wcat and organizers to receive a notification email" do
        competition.organizers << organizer1
        competition.update_attributes(start_date: 5.week.from_now, end_date: 5.week.from_now)
        expect(CompetitionsMailer).to receive(:notify_organizer_of_confirmed_competition).with(competition.delegates.last, competition, organizer1).and_call_original
        expect(CompetitionsMailer).to receive(:notify_wcat_of_confirmed_competition).with(competition.delegates.last, competition).and_call_original
        expect do
          patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Confirm" }
        end.to change { enqueued_jobs.size }.by(2)
        expect(response).to redirect_to edit_competition_path(competition)
        expect(competition.reload.confirmed?).to eq true
      end

      it "cannot confirm a competition that is not at least 28 days in the future" do
        competition.update_attributes(start_date: 26.day.from_now, end_date: 26.day.from_now)
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Confirm" }
        expect(competition.reload.confirmed?).to eq false
      end

      it "cannot delete not confirmed, but visible competition" do
        competition.update_attributes(confirmed: false, showAtAll: true)
        # Attempt to delete competition. This should not work, because we only allow
        # deletion of (not confirmed and not visible) competitions.
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Delete" }
        expect(flash[:danger]).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end

      it "cannot delete confirmed competition" do
        competition.update_attributes(confirmed: true, showAtAll: false)
        # Attempt to delete competition. This should not work, because we only let
        # delegates deleting unconfirmed competitions.
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Delete" }
        expect(flash[:danger]).to eq "Cannot delete a confirmed competition."
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end

      it "can delete not confirmed and not visible competition" do
        competition.update_attributes(confirmed: false, showAtAll: false)
        # Attempt to delete competition. This should work, because we allow
        # deletion of (not confirmed and not visible) competitions.
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Delete" }
        expect(Competition.find_by_id(competition.id)).to be_nil
        expect(response).to redirect_to root_url
      end

      it "cannot change registration open/close of locked competition" do
        old_open = 2.days.from_now.change(sec: 0)
        old_close = 4.weeks.from_now.change(sec: 0)
        competition.update_attributes(confirmed: true, registration_open: old_open, registration_close: old_close)

        new_open = 1.week.from_now.change(sec: 0)
        new_close = 2.weeks.from_now.change(sec: 0)
        patch :update, params: { id: competition, competition: { registration_open: new_open, registration_close: new_close } }
        expect(competition.reload.registration_open).to eq old_open
        expect(competition.reload.registration_close).to eq old_close
      end

      it "can change extra registration requirements field before competition is confirmed" do
        new_requirements = "New extra requirements"
        patch :update, params: { id: competition, competition: { extra_registration_requirements: new_requirements } }
        competition.reload
        expect(competition.extra_registration_requirements).to eq new_requirements
      end

      it "cannot change extra registration requirements field after competition is confirmed" do
        comp = FactoryBot.create(:competition, :confirmed, delegates: [delegate], extra_registration_requirements: "Extra requirements")
        new_requirements = "New extra requirements"
        patch :update, params: { id: comp, competition: { extra_registration_requirements: new_requirements } }
        comp.reload
        expect(comp.extra_registration_requirements).to eq "Extra requirements"
      end
    end

    context "when signed in as delegate for a different competition" do
      let(:delegate) { FactoryBot.create(:delegate) }
      before :each do
        sign_in delegate
      end

      it "cannot delete competition they are not delegating" do
        competition.update_attributes(confirmed: false, showAtAll: true)
        # Attempt to delete competition. This should not work, because we're
        # not the delegate for this competition.
        patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Delete" }
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end
    end
  end

  describe 'GET #post_announcement' do
    context 'when signed in as competition announcement team member' do
      let(:wcat_member) { FactoryBot.create(:user, :wcat_member) }

      it 'announces and expects organizers to receive a notification email' do
        sign_in wcat_member
        competition.update_attributes(start_date: "2011-12-04", end_date: "2011-12-05")
        organizer = FactoryBot.create :user
        competition.organizers << organizer
        expect(competition.announced_at).to be nil
        expect(competition.announced_by).to be nil
        expect(CompetitionsMailer).to receive(:notify_organizer_of_announced_competition).with(competition, organizer).and_call_original
        expect do
          post :post_announcement, params: { id: competition }
        end.to change { enqueued_jobs.size }.by(1)
        competition.reload
        expect(competition.announced_at.to_f).to be < Time.now.to_f
        expect(competition.announced_by).to eq wcat_member.id
      end
    end
  end

  describe 'POST #post_results' do
    context 'when signed in as results team member' do
      let(:wrt_member) { FactoryBot.create(:user, :wrt_member) }

      before :each do
        sign_in wrt_member
      end

      it "sends the notification emails to users that competed" do
        FactoryBot.create_list(:user_with_wca_id, 4, results_notifications_enabled: true).each do |user|
          FactoryBot.create_list(:result, 2, person: user.person, competitionId: competition.id, eventId: "333")
        end

        expect(competition.results_posted_at).to be nil
        expect(competition.results_posted_by).to be nil
        expect(CompetitionsMailer).to receive(:notify_users_of_results_presence).and_call_original.exactly(4).times
        expect do
          post :post_results, params: { id: competition }
        end.to change { enqueued_jobs.size }.by(4)
        competition.reload
        expect(competition.results_posted_at.to_f).to be < Time.now.to_f
        expect(competition.results_posted_by).to eq wrt_member.id
      end

      it "sends notifications of id claim possibility to newcomers" do
        competition = FactoryBot.create(:competition, :registration_open)
        FactoryBot.create_list(:registration, 2, :accepted, :newcomer, competition: competition)
        FactoryBot.create_list(:registration, 3, :pending, :newcomer, competition: competition)
        FactoryBot.create_list(:registration, 4, :accepted, competition: competition)
        FactoryBot.create_list(:user_with_wca_id, 4).each do |user|
          FactoryBot.create_list(:result, 2, person: user.person, competitionId: competition.id, eventId: "333")
        end

        expect(CompetitionsMailer).to receive(:notify_users_of_id_claim_possibility).and_call_original.exactly(2).times
        expect do
          post :post_results, params: { id: competition }
        end.to change { enqueued_jobs.size }.by(2)
      end

      it "assigns wca id when user matches one person in results" do
        competition = FactoryBot.create(:competition, :registration_open)
        reg = FactoryBot.create(:registration, :accepted, competition: competition)
        FactoryBot.create(:result, competition: competition, person: reg.person, eventId: "333")

        wca_id = reg.user.wca_id
        reg.user.update(wca_id: nil)

        post :post_results, params: { id: competition }

        expect(reg.user.reload.wca_id).to eq wca_id
      end

      it "does not assign wca id when user matches several persons in results" do
        competition = FactoryBot.create(:competition, :registration_open)
        user = FactoryBot.create(:user_with_wca_id)
        person = user.person
        FactoryBot.create(:registration, :accepted, competition: competition, user: user)
        FactoryBot.create(:result, competition: competition, person: person, eventId: "333")
        another_person = FactoryBot.create(:person, name: person.name, countryId: person.countryId, gender: person.gender, year: person.year, month: person.month, day: person.day)
        FactoryBot.create(:result, competition: competition, person: another_person, eventId: "333")

        user.update(wca_id: nil)

        post :post_results, params: { id: competition }

        expect(user.reload.wca_id).to be_nil
      end

      it "does not assign wca id when user matches results but wca id is already assigned" do
        competition = FactoryBot.create(:competition, :registration_open)
        user = FactoryBot.create(:user_with_wca_id)
        user2 = FactoryBot.create(:user_with_wca_id)
        FactoryBot.create(:registration, :accepted, competition: competition, user: user)
        FactoryBot.create(:result, competition: competition, person: user.person, eventId: "333")

        wca_id = user.wca_id
        user.update(wca_id: nil)
        user2.update(wca_id: wca_id)

        post :post_results, params: { id: competition }

        expect(user.reload.wca_id).to be_nil
      end
    end
  end

  describe 'GET #my_competitions' do
    let(:delegate) { FactoryBot.create(:delegate) }
    let(:organizer) { FactoryBot.create(:user) }
    let!(:future_competition1) { FactoryBot.create(:competition, :registration_open, starts: 3.week.from_now, organizers: [organizer], delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:future_competition2) { FactoryBot.create(:competition, :registration_open, starts: 2.weeks.from_now, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let!(:future_competition3) { FactoryBot.create(:competition, :registration_open, starts: 1.weeks.from_now, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let!(:future_competition4) { FactoryBot.create(:competition, :registration_open, starts: 1.weeks.from_now, organizers: [], events: Event.where(id: %w(222 333))) }
    let!(:past_competition1) { FactoryBot.create(:competition, :registration_open, starts: 1.month.ago, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let!(:past_competition2) { FactoryBot.create(:competition, :registration_open, starts: 2.month.ago, delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:past_competition3) { FactoryBot.create(:competition, :registration_open, starts: 3.month.ago, delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:past_competition4) { FactoryBot.create(:competition, :registration_open, :results_posted, starts: 4.month.ago, delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:unscheduled_competition1) { FactoryBot.create(:competition, starts: nil, ends: nil, delegates: [delegate], events: Event.where(id: %w(222 333)), year: "0") }
    let(:registered_user) { FactoryBot.create :user, name: "Jan-Ove Waldner" }
    let!(:registration1) { FactoryBot.create(:registration, :accepted, competition: future_competition1, user: registered_user) }
    let!(:registration2) { FactoryBot.create(:registration, :accepted, competition: future_competition3, user: registered_user) }
    let!(:registration3) { FactoryBot.create(:registration, :accepted, competition: past_competition1, user: registered_user) }
    let!(:registration4) { FactoryBot.create(:registration, :accepted, competition: past_competition3, user: organizer) }
    let!(:registration5) { FactoryBot.create(:registration, :accepted, competition: future_competition3, user: delegate) }
    let!(:results_person) { FactoryBot.create(:person, wca_id: "2014PLUM01", name: "Jeff Plumb") }
    let!(:results_user) { FactoryBot.create :user, name: "Jeff Plumb", wca_id: "2014PLUM01" }
    let!(:result) { FactoryBot.create(:result, person: results_person, competitionId: past_competition1.id) }

    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :my_competitions
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as user with results for a comp they did not register for' do
      before do
        sign_in results_user
      end

      it 'shows my upcoming and past competitions' do
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq []
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end
    end

    context 'when signed in as a regular user' do
      before do
        sign_in registered_user
      end

      it 'shows my upcoming and past competitions' do
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end

      it 'does not show past competitions they have a rejected registration for' do
        FactoryBot.create(:registration, :deleted, competition: past_competition2, user: registered_user)
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end

      it 'does not show upcoming competitions they have a rejected registration for' do
        FactoryBot.create(:registration, :deleted, competition: future_competition2, user: registered_user)
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end

      it 'shows upcoming competition they have a pending registration for' do
        FactoryBot.create(:registration, :pending, competition: future_competition2, user: registered_user)
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition2, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end

      it 'does not show past competitions they have a pending registration for' do
        FactoryBot.create(:registration, :pending, competition: past_competition2, user: registered_user)
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end

      it 'does not show past competitions with results uploaded they have an accepted registration but not results for' do
        FactoryBot.create(:registration, :accepted, competition: past_competition4, user: registered_user)
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1]
      end

      it 'shows upcoming competitions they have bookmarked' do
        BookmarkedCompetition.create(competition: future_competition2, user: registered_user)
        BookmarkedCompetition.create(competition: future_competition4, user: registered_user)
        get :my_competitions
        expect(assigns(:bookmarked_competitions)).to eq [future_competition4, future_competition2]
      end

      it 'does not show past competitions they have bookmarked' do
        BookmarkedCompetition.create(competition: past_competition1, user: registered_user)
        get :my_competitions
        expect(assigns(:bookmarked_competitions)).to eq []
      end
    end

    context 'when signed in as an organizer' do
      before do
        sign_in organizer
      end

      it 'shows my upcoming and past competitions' do
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [future_competition1, future_competition2, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition1, past_competition3]
      end
    end

    context 'when signed in as a delegate' do
      before do
        sign_in delegate
      end

      it 'shows my upcoming and past competitions' do
        get :my_competitions
        expect(assigns(:not_past_competitions)).to eq [unscheduled_competition1, future_competition1, future_competition3]
        expect(assigns(:past_competitions)).to eq [past_competition2, past_competition3, past_competition4]
      end
    end
  end

  describe 'POST #bookmark' do
    let!(:user) { FactoryBot.create(:user) }
    let!(:competition) { FactoryBot.create(:competition, :visible) }

    context 'when signed in' do
      before do
        sign_in user
      end

      it 'bookmarks a competition' do
        expect(user.is_bookmarked?(competition)).to eq false
        post :bookmark, params: { id: competition.id }
        expect(user.is_bookmarked?(competition)).to eq true
      end

      it 'unbookmarks a competition' do
        post :bookmark, params: { id: competition.id }
        expect(user.is_bookmarked?(competition)).to eq true
        post :unbookmark, params: { id: competition.id }
        expect(user.is_bookmarked?(competition)).to eq false
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
      sign_in { FactoryBot.create :admin }

      it 'shows the edit competition events form' do
        get :edit_events, params: { id: competition.id }
        expect(response).to render_template :edit_events
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryBot.create :user }

      it 'does not allow access' do
        expect {
          get :edit_events, params: { id: competition.id }
        }.to raise_error(ActionController::RoutingError)
      end
    end
  end

  describe 'GET #payment_setup' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :payment_setup, params: { id: competition }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryBot.create :admin }

      it 'displays payment setup status' do
        get :payment_setup, params: { id: competition }
        expect(response.status).to eq 200
        expect(assigns(:competition)).to eq competition
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryBot.create :user }

      it 'does not allow access' do
        expect {
          get :payment_setup, params: { id: competition }
        }.to raise_error(ActionController::RoutingError)
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
      sign_in { FactoryBot.create :user }

      it 'does not allow access' do
        expect {
          get :stripe_connect, params: { state: competition }
        }.to raise_error(ActionController::RoutingError)
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
      sign_in { FactoryBot.create :user }

      it 'does not allow access' do
        expect {
          get :edit_schedule, params: { id: competition }
        }.to raise_error(ActionController::RoutingError)
      end
    end

    context 'when signed in as a competition delegate' do
      before do
        sign_in competition.delegates.first
      end

      it 'displays the page' do
        # NOTE: we test the javascript part renders in the feature spec!
        get :edit_schedule, params: { id: competition }
        expect(response.status).to eq 200
        expect(assigns(:competition)).to eq competition
      end
    end
  end
end
