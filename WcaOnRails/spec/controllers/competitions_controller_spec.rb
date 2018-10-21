# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionsController do
  let(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open) }
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

    describe "selecting present/past/recent/custom competitions" do
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

  describe 'GET #edit' do
    let(:organizer) { FactoryBot.create(:user) }
    let(:admin) { FactoryBot.create :admin }
    let!(:my_competition) { FactoryBot.create(:competition, :confirmed, latitude: 10.0, longitude: 10.0, organizers: [organizer], starts: 1.week.ago) }
    let!(:other_competition) { FactoryBot.create(:competition, :with_delegate, latitude: 11.0, longitude: 11.0, starts: 1.day.ago) }

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
        post :create, params: { competition: { name: "FatBoyXPC 2015" } }
        new_comp = assigns(:competition)
        expect(response).to redirect_to edit_competition_path("FatBoyXPC2015")
        expect(new_comp.id).to eq "FatBoyXPC2015"
        expect(new_comp.name).to eq "FatBoyXPC 2015"
        expect(new_comp.cellName).to eq "FatBoyXPC 2015"
      end

      it "creates a competition with correct website when using WCA as competition's website" do
        post :create, params: { competition: { name: "Awesome Competition 2016", external_website: nil, generate_website: "1" } }
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
          post :create, params: { competition: { name: "Test 2015", delegate_ids: delegate.id, organizer_ids: organizer.id } }
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

      it "can confirm competition and expects board and organizers to receive a notification email" do
        expect(CompetitionsMailer).to receive(:notify_organizers_of_confirmed_competition).with(competition.delegates.last, competition).and_call_original
        expect(CompetitionsMailer).to receive(:notify_wcat_of_confirmed_competition).with(competition.delegates.last, competition).and_call_original
        expect do
          patch :update, params: { id: competition, competition: { name: competition.name }, commit: "Confirm" }
        end.to change { enqueued_jobs.size }.by(2)
        expect(response).to redirect_to edit_competition_path(competition)
        expect(competition.reload.confirmed?).to eq true
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

      it "can change registration open/close of locked competition" do
        competition.update_attribute(:confirmed, true)

        new_open = 1.week.from_now.change(sec: 0)
        new_close = 2.weeks.from_now.change(sec: 0)
        patch :update, params: { id: competition, competition: { registration_open: new_open, registration_close: new_close } }
        expect(competition.reload.registration_open).to eq new_open
        expect(competition.reload.registration_close).to eq new_close
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
    context 'when signed in as results team member' do
      sign_in { FactoryBot.create(:user, :wrt_member) }

      # Posts should always be in English, therefore we want to check using an English text,
      # even if the user posting has a different locale
      before :each do
        session[:locale] = :fr
      end

      it 'creates an announcement post and expects organizers to receive a notification email' do
        competition.update_attributes(start_date: "2011-12-04", end_date: "2011-12-05")
        organizer = FactoryBot.create :user
        competition.organizers << organizer
        expect(CompetitionsMailer).to receive(:notify_organizers_of_announced_competition).with(competition, anything).and_call_original
        expect do
          get :post_announcement, params: { id: competition }
        end.to change { enqueued_jobs.size }.by(1)
        post = assigns(:post)
        expect(post.title).to eq "#{competition.name} on December 4 - 5, 2011 in #{competition.cityName}, #{competition.country.name_in(:en)}"
        expect(post.body).to match(/in #{competition.cityName}, #{competition.country.name_in(:en)}\./)
        expect(post.tags_array).to match_array %w(competitions new)
      end

      it 'handles nil start date' do
        competition.update_attributes(start_date: "", end_date: "")
        get :post_announcement, params: { id: competition }
        post = assigns(:post)
        expect(post.title).to match(/No date/)
      end
    end
  end

  describe 'GET #post_results' do
    context 'when signed in as results team member' do
      sign_in { FactoryBot.create(:user, :wrt_member) }

      # Posts should always be in English, therefore we want to check using an English text,
      # even if the user posting has a different locale
      before :each do
        session[:locale] = :fr
      end

      it "handles no event" do
        get :post_results, params: { id: competition }
        post = assigns(:post)
        expect(post.title).to eq "Results of #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)} posted"
        expect(post.body).to eq "Results of the [#{competition.name}](#{competition_url(competition)}) are now available.\n\n"
      end

      context "winners announcement" do
        context "333" do
          def add_result(pos, name, event_id: "333", dnf: false)
            Result.create!(
              pos: pos,
              personId: "2006YOYO#{format('%.2d', pos)}",
              personName: name,
              countryId: "USA",
              competitionId: competition.id,
              eventId: event_id,
              roundTypeId: "f",
              formatId: "a",
              value1: dnf ? SolveTime::DNF_VALUE : 999,
              value2: 999,
              value3: 999,
              value4: dnf ? SolveTime::DNF_VALUE : 999,
              value5: 999,
              best: 999,
              average: dnf ? SolveTime::DNF_VALUE : 999,
            )
          end

          let!(:unrelated_podium_result) { add_result(1, "joe", event_id: "333oh") }

          it "announces top 3 in final" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven")

            get :post_results, params: { id: competition, event_id: "333" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with an average of 9.99 seconds. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (9.99) and " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (9.99).\n\n"
          end

          it "handles only 2 people in final" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")

            get :post_results, params: { id: competition, event_id: "333" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with an average of 9.99 seconds. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (9.99).\n\n"
          end

          it "handles only 1 person in final" do
            add_result(1, "Jeremy")

            get :post_results, params: { id: competition, event_id: "333" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with an average of 9.99 seconds.\n\n"
          end

          it "handles DNF averages in the podium" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven", dnf: true)

            get :post_results, params: { id: competition, event_id: "333" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with an average of 9.99 seconds. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (9.99) and " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 9.99 seconds).\n\n"
          end

          it "handles ties in the podium" do
            add_result(1, "Jeremy")
            add_result(1, "Dan")
            add_result(3, "Steven", dnf: true)

            get :post_results, params: { id: competition, event_id: "333" }
            post = assigns(:post)
            expect(post.title).to eq "Dan and Jeremy win #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Dan](#{person_url('2006YOYO01')}) and [Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with an average of 9.99 seconds. " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 9.99 seconds).\n\n"
          end

          it "handles tied third place" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven", dnf: true)
            add_result(3, "John", dnf: true)

            get :post_results, params: { id: competition, event_id: "333" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with an average of 9.99 seconds. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (9.99) and " \
              "[John](#{person_url('2006YOYO03')}) and [Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 9.99 seconds).\n\n"
          end
        end

        context "333bf" do
          def add_result(pos, name)
            Result.create!(
              pos: pos,
              personId: "2006YOYO#{format('%.2d', pos)}",
              personName: name,
              countryId: "USA",
              competitionId: competition.id,
              eventId: "333bf",
              roundTypeId: "f",
              formatId: "3",
              value1: 60.seconds.in_centiseconds,
              value2: 60.seconds.in_centiseconds,
              value3: 60.seconds.in_centiseconds,
              value4: 0,
              value5: 0,
              best: 60.seconds.in_centiseconds,
              average: 60.seconds.in_centiseconds,
            )
          end

          it "announces top 3 in final" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven")

            get :post_results, params: { id: competition, event_id: "333bf" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with a single solve of 1:00.00 in the 3x3x3 Blindfolded event. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (1:00.00) and " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (1:00.00).\n\n"
            expect(post.tags_array).to match_array %w(results)
          end
        end

        context "333fm" do
          def add_result(pos, name, dnf: false)
            Result.create!(
              pos: pos,
              personId: "2006YOYO#{format('%.2d', pos)}",
              personName: name,
              countryId: "USA",
              competitionId: competition.id,
              eventId: "333fm",
              roundTypeId: "f",
              formatId: "m",
              value1: dnf ? SolveTime::DNF_VALUE : 29,
              value2: 24,
              value3: 30,
              value4: 0,
              value5: 0,
              best: 24,
              average: dnf ? SolveTime::DNF_VALUE : 2766,
            )
          end

          it "announces top 3 in final" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven")

            get :post_results, params: { id: competition, event_id: "333fm" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with a mean of 27.66 moves in the 3x3x3 Fewest Moves event. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (27.66) and " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (27.66).\n\n"
          end

          it "handles DNF averages in the podium" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven", dnf: true)

            get :post_results, params: { id: competition, event_id: "333fm" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with a mean of 27.66 moves in the 3x3x3 Fewest Moves event. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (27.66) and " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 24 moves).\n\n"
          end
        end

        context "333mbf" do
          def add_result(pos, name)
            solve_time = SolveTime.new("333mbf", :best, 0)
            solve_time.attempted = 9
            solve_time.solved = 8
            solve_time.time_centiseconds = (45.minutes + 32.seconds).in_centiseconds
            Result.create!(
              pos: pos,
              personId: "2006YOYO#{format('%.2d', pos)}",
              personName: name,
              countryId: "USA",
              competitionId: competition.id,
              eventId: "333mbf",
              roundTypeId: "f",
              formatId: "3",
              value1: solve_time.wca_value,
              value2: solve_time.wca_value,
              value3: solve_time.wca_value,
              value4: 0,
              value5: 0,
              best: solve_time.wca_value,
              average: 0,
            )
          end

          it "announces top 3 in final" do
            add_result(1, "Jeremy")
            add_result(2, "Dan")
            add_result(3, "Steven")

            get :post_results, params: { id: competition, event_id: "333mbf" }
            post = assigns(:post)
            expect(post.title).to eq "Jeremy wins #{competition.name}, in #{competition.cityName}, #{competition.country.name_in(:en)}"
            expect(post.body).to eq "[Jeremy](#{person_url('2006YOYO01')}) won the [#{competition.name}](#{competition_url(competition)}) with a result of 8/9 45:32 in the 3x3x3 Multi-Blind event. " \
              "[Dan](#{person_url('2006YOYO02')}) finished second (8/9 45:32) and " \
              "[Steven](#{person_url('2006YOYO03')}) finished third (8/9 45:32).\n\n"
          end
        end
      end

      it "announces world records" do
        Result.create!(
          pos: 1,
          personId: "2006SHEU01",
          personName: "Vincent Sheu",
          countryId: "USA",
          competitionId: competition.id,
          eventId: "333fm",
          roundTypeId: "f",
          formatId: "m",
          value1: 25,
          value2: 26,
          value3: 27,
          best: 25,
          average: 2600,
          regionalSingleRecord: "WR",
          regionalAverageRecord: "WR",
        )
        # Another Vincent Sheu!
        Result.create!(
          pos: 1,
          personId: "2006SHEU02",
          personName: "Vincent Sheu",
          countryId: "USA",
          competitionId: competition.id,
          eventId: "222",
          roundTypeId: "f",
          formatId: "m",
          value1: 1000,
          value2: 2000,
          value3: 3000,
          best: 1000,
          average: 2000,
          regionalSingleRecord: "WR",
          regionalAverageRecord: "",
        )
        Result.create!(
          pos: 1,
          personId: "2005FLEI01",
          personName: "Jeremy Fleischman",
          countryId: "USA",
          competitionId: competition.id,
          eventId: "333oh",
          roundTypeId: "f",
          formatId: "m",
          value1: 4000,
          value2: 5000,
          value3: 6000,
          best: 4000,
          average: 5000,
          regionalSingleRecord: "NAR",
          regionalAverageRecord: "WR",
        )
        Result.create!(
          pos: 1,
          personId: "2005FLEI01",
          personName: "Jeremy Fleischman",
          countryId: "USA",
          competitionId: competition.id,
          eventId: "333oh",
          roundTypeId: "1",
          formatId: "m",
          value1: 4100,
          value2: 5100,
          value3: 6100,
          best: 4100,
          average: 5100,
          regionalSingleRecord: "NAR",
          regionalAverageRecord: "",
        )
        expect(competition.results_posted_at).to be nil
        get :post_results, params: { id: competition }
        post = assigns(:post)
        expect(post.body).to include "World records: Jeremy Fleischman&lrm; 3x3x3 One-Handed 50.00 (average), " \
          "Vincent Sheu (2006SHEU01)&lrm; 3x3x3 Fewest Moves 25 (single), 3x3x3 Fewest Moves 26.00 (average), " \
          "Vincent Sheu (2006SHEU02)&lrm; 2x2x2 Cube 10.00 (single)"
        expect(post.body).to include "North American records: Jeremy Fleischman&lrm; 3x3x3 One-Handed 41.00 (single), 3x3x3 One-Handed 40.00 (single)"
        expect(post.title).to include "in #{competition.cityName}, #{competition.country.name_in(:en)}"
        competition.reload
        expect(competition.results_posted_at.to_f).to be < Time.now.to_f
      end

      it "sends the notification emails to users that competed" do
        FactoryBot.create_list(:user_with_wca_id, 4, results_notifications_enabled: true).each do |user|
          FactoryBot.create_list(:result, 2, person: user.person, competitionId: competition.id)
        end

        expect(CompetitionsMailer).to receive(:notify_users_of_results_presence).and_call_original.exactly(4).times
        get :post_results, params: { id: competition }
        assert_enqueued_jobs 4
      end

      it "sends notifications of id claim possibility to newcomers" do
        competition = FactoryBot.create(:competition, :registration_open)
        FactoryBot.create_list(:registration, 2, :accepted, :newcomer, competition: competition)
        FactoryBot.create_list(:registration, 3, :pending, :newcomer, competition: competition)
        FactoryBot.create_list(:registration, 4, :accepted, competition: competition)

        expect(CompetitionsMailer).to receive(:notify_users_of_id_claim_possibility).and_call_original.exactly(2).times
        get :post_results, params: { id: competition }
        assert_enqueued_jobs 2
      end
    end
  end

  describe 'GET #my_competitions' do
    let(:delegate) { FactoryBot.create(:delegate) }
    let(:organizer) { FactoryBot.create(:user) }
    let!(:future_competition1) { FactoryBot.create(:competition, :registration_open, starts: 3.week.from_now, organizers: [organizer], delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:future_competition2) { FactoryBot.create(:competition, :registration_open, starts: 2.weeks.from_now, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let!(:future_competition3) { FactoryBot.create(:competition, :registration_open, starts: 1.weeks.from_now, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let!(:past_competition1) { FactoryBot.create(:competition, :registration_open, starts: 1.month.ago, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let!(:past_competition2) { FactoryBot.create(:competition, :registration_open, starts: 2.month.ago, delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:past_competition3) { FactoryBot.create(:competition, :registration_open, starts: 3.month.ago, delegates: [delegate], events: Event.where(id: %w(222 333))) }
    let!(:past_competition4) { FactoryBot.create(:competition, :registration_open, starts: 4.month.ago, results_posted_at: 1.month.ago, delegates: [delegate], events: Event.where(id: %w(222 333))) }
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

  describe 'POST #update_events' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        patch :update_events, params: { id: competition, competition: { name: competition.name } }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryBot.create :admin }

      it 'updates the competition events' do
        patch :update_events, params: { id: competition, competition: { name: competition.name } }
        expect(response).to redirect_to edit_events_path(competition)
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryBot.create :user }

      it 'does not allow access' do
        expect {
          patch :update_events, params: { id: competition, competition: { name: competition.name } }
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
