require 'rails_helper'

describe CompetitionsController do
  let(:competition) { FactoryGirl.create(:competition, :with_delegate) }

  describe 'GET #index' do
    describe "selecting events" do
      let!(:competition1) { FactoryGirl.create(:competition, starts: 1.week.from_now, eventSpecs: "222 333 444 555 666") }
      let!(:competition2) { FactoryGirl.create(:competition, starts: 2.week.from_now, eventSpecs: "333 444 555 pyram clock") }
      let!(:competition3) { FactoryGirl.create(:competition, starts: 3.week.from_now, eventSpecs: "222 333 skewb 666 pyram sq1") }
      let!(:competition4) { FactoryGirl.create(:competition, starts: 4.week.from_now, eventSpecs: "333 pyram 666 777 clock") }

      context "when no event is selected" do
        it "competitions are sorted by start date" do
          get :index
          expect(assigns(:competitions)).to eq [competition1, competition2, competition3, competition4]
        end
      end

      context "when events are selected" do
        it "only competitions matching all of the selected events are shown" do
          get :index, event_ids: %w(333 pyram clock)
          expect(assigns(:competitions)).to eq [competition2, competition4]
        end

        it "competitions are still sorted by start date" do
          get :index, event_ids: ["333"]
          expect(assigns(:competitions)).to eq [competition1, competition2, competition3, competition4]
        end

        # See: https://github.com/cubing/worldcubeassociation.org/issues/472
        it "works when event_ids are passed as a hash instead of an array (facebook redirection)" do
          get :index, event_ids: { "0" => "333", "1" => "pyram", "2" => "clock" }
          expect(assigns(:competitions)).to eq [competition2, competition4]
        end
      end
    end

    describe "selecting present/past competitions" do
      let!(:past_comp1) { FactoryGirl.create(:competition, starts: 1.year.ago) }
      let!(:past_comp2) { FactoryGirl.create(:competition, starts: 3.years.ago) }
      let!(:in_progress_comp1) { FactoryGirl.create(:competition, starts: Date.today, ends: 1.day.from_now) }
      let!(:in_progress_comp2) { FactoryGirl.create(:competition, starts: Date.today, ends: Date.today) }
      let!(:upcoming_comp1) { FactoryGirl.create(:competition, starts: 2.weeks.from_now) }
      let!(:upcoming_comp2) { FactoryGirl.create(:competition, starts: 3.weeks.from_now) }

      context "when present is selected" do
        before do
          get :index, state: :present
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
          get :index, state: :past, year: "all years"
          expect(assigns(:competitions)).to match [past_comp1, past_comp2]
        end

        it "when a single year is selected, shows past competitions from this year" do
          get :index, state: :past, year: past_comp1.year
          expect(assigns(:competitions)).to eq [past_comp1]
        end

        it "competitions are sorted descending by date" do
          get :index, state: :past, year: "all years"
          expect(assigns(:competitions)).to eq [past_comp1, past_comp2]
        end
      end
    end
  end

  describe 'GET #show' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the old php page' do
        get :show, id: competition.id
        expect(response).to redirect_to "/results/c.php?i=#{competition.id}"
      end

      it '404s when competition is not visible' do
        competition.update_column(:showAtAll, false)

        expect {
          get :show, id: competition.id
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
      sign_in { FactoryGirl.create :admin }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a delegate' do
      sign_in { FactoryGirl.create :delegate }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        get :new
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'POST #create' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        post :create, competition: { name: "Test2015" }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }
      it 'does not allow creation' do
        post :create, competition: { name: "Test2015" }
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'creates a new competition' do
        post :create, competition: { name: "FatBoyXPC 2015" }
        expect(response).to redirect_to edit_competition_path("FatBoyXPC2015")
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "FatBoyXPC2015"
        expect(new_comp.name).to eq "FatBoyXPC 2015"
        expect(new_comp.cellName).to eq "FatBoyXPC 2015"
      end
    end

    context 'when signed in as a delegate' do
      let(:delegate) { FactoryGirl.create :delegate }
      before :each do
        sign_in delegate
      end

      it 'creates a new competition' do
        post :create, competition: { name: "Test 2015", competition_id_to_clone: "" }
        expect(response).to redirect_to edit_competition_path("Test2015")
        expect(flash[:success]).to eq "Successfully created new competition!"
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "Test2015"
        expect(new_comp.delegates).to include subject.current_user
      end

      it 'shows an error message under name when creating a competition with a duplicate id' do
        competition = FactoryGirl.create :competition
        post :create, competition: { name: competition.name, competition_id_to_clone: "" }
        expect(response).to render_template(:new)
        new_comp = assigns(:competition)
        expect(new_comp.errors.messages[:name]).to eq ["has already been taken"]
      end

      it 'clones a competition' do
        # First, lock the competition
        competition.update_attribute(:isConfirmed, true)

        user1 = FactoryGirl.create(:delegate)
        user2 = FactoryGirl.create(:user)
        user3 = FactoryGirl.create(:user)
        competition.delegates << user1
        competition.organizers << user2
        competition.organizers << user3
        post :create, competition: { name: "Test 2015", competition_id_to_clone: competition.id }
        expect(response).to redirect_to edit_competition_path("Test2015")
        expect(flash[:success]).to eq "Successfully cloned #{competition.id}!"
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "Test2015"
        expect(new_comp.name).to eq "Test 2015"
        # When cloning a competition, we don't want to clone its showAtAll and isConfirmed
        # attributes.
        expect(new_comp.showAtAll).to eq false
        expect(new_comp.isConfirmed).to eq false

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq competition.organizers.sort_by(&:id)
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq (competition.delegates + [delegate]).sort_by(&:id)
      end

      it 'clones a competition that they delegated' do
        # First, make ourselves the delegate of the competition we're going to clone.
        competition.delegates = [delegate]
        post :create, competition: { name: "Test 2015", competition_id_to_clone: competition.id }
        expect(response).to redirect_to edit_competition_path("Test2015")
        expect(flash[:success]).to eq "Successfully cloned #{competition.id}!"
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "Test2015"

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq []
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq [delegate]
      end

      it 'clones an non existant competition' do
        post :create, competition: { name: "Test 2015", competition_id_to_clone: "invalidcompetitionid" }
        expect(response).to render_template(:new)
        invalid_competition = assigns(:competition)
        expect(invalid_competition.errors.messages[:competition_id_to_clone]).to eq ["invalid"]
      end
    end
  end

  describe 'POST #update' do
    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'redirects organizer view to organizer view' do
        patch :update, id: competition, competition: { name: competition.name }
        expect(response).to redirect_to edit_competition_path(competition)
      end

      it 'redirects admin view to admin view' do
        patch :update, id: competition, competition: { name: competition.name }, competition_admin_view: true
        expect(response).to redirect_to admin_edit_competition_path(competition)
      end

      it 'renders admin view when failing to save admin view' do
        patch :update, id: competition, competition: { name: "fooo" }, competition_admin_view: true
        expect(response).to render_template :edit
        competition_admin_view = assigns(:competition_admin_view)
        expect(competition_admin_view).to be true
      end

      it 'can confirm competition' do
        patch :update, id: competition, competition: { name: competition.name }, commit: "Confirm"
        expect(response).to redirect_to edit_competition_path(competition)
        expect(competition.reload.isConfirmed?).to eq true
      end

      it 'saves delegate_ids' do
        delegate1 = FactoryGirl.create(:delegate)
        delegate2 = FactoryGirl.create(:delegate)
        delegates = [delegate1, delegate2]
        delegate_ids = delegates.map(&:id).join(",")
        patch :update, id: competition, competition: { delegate_ids: delegate_ids }
        expect(competition.reload.delegates).to eq delegates
      end

      it "saving removes nonexistent delegates" do
        invalid_competition_delegate = CompetitionDelegate.new(competition_id: competition.id, delegate_id: 2000000)
        invalid_competition_delegate.save(validate: false)
        patch :update, id: competition, competition: { name: competition.name }
        expect(CompetitionDelegate.find_by_id(invalid_competition_delegate.id)).to be_nil
      end

      it "saving removes nonexistent organizers" do
        invalid_competition_organizer = CompetitionOrganizer.new(competition_id: competition.id, organizer_id: 2000000)
        invalid_competition_organizer.save(validate: false)
        patch :update, id: competition, competition: { name: competition.name }
        expect(CompetitionDelegate.find_by_id(invalid_competition_organizer.id)).to be_nil
      end

      it "can change competition id" do
        cds = competition.competition_delegates.to_a
        cos = competition.competition_organizers.to_a

        old_id = competition.id
        patch :update, id: competition, competition: { id: "NewId2015", delegate_ids: competition.delegates.map(&:id).join(",") }

        expect(CompetitionDelegate.where(competition_id: old_id).count).to eq 0
        expect(CompetitionOrganizer.where(competition_id: old_id).count).to eq 0
        expect(CompetitionDelegate.where(competition_id: "NewId2015").map(&:id).sort).to eq cds.map(&:id).sort
        expect(CompetitionOrganizer.where(competition_id: "NewId2015").map(&:id).sort).to eq cos.map(&:id).sort
      end
    end

    context 'when signed in as organizer' do
      let(:organizer) { FactoryGirl.create(:delegate) }
      before :each do
        competition.organizers << organizer
        competition.save!
        sign_in organizer
      end

      it 'cannot pass a non-delegate as delegate' do
        delegate_ids_old = competition.delegate_ids
        fake_delegate = FactoryGirl.create(:user)
        post :update, id: competition, competition: { delegate_ids: fake_delegate.id }
        invalid_competition = assigns(:competition)
        expect(invalid_competition.errors.messages[:delegate_ids]).to eq ["are not all delegates"]
        competition.reload
        expect(competition.delegate_ids).to eq delegate_ids_old
      end

      it 'can change the delegate' do
        new_delegate = FactoryGirl.create(:delegate)
        post :update, id: competition, competition: { delegate_ids: new_delegate.id }
        competition.reload
        expect(competition.delegates).to eq [new_delegate]
      end

      it 'cannot confirm competition' do
        patch :update, id: competition, competition: { name: competition.name }, commit: "Confirm"
        expect(response.status).to redirect_to edit_competition_path(competition)
        expect(competition.reload.isConfirmed?).to eq false
      end

      it "who is also the delegate can remove oneself as delegate" do
        # First, make the organizer of the competition the delegate of the competition.
        competition.delegates << organizer
        competition.save!

        # Remove ourself as a delegate. This should be allowed, because we're
        # still an organizer.
        patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: organizer.id }
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq [organizer]
      end

      it "organizer cannot demote oneself" do
        # Attempt to remove ourself as an organizer. This should not be allowed, because
        # we would not be allowed to access the page anymore.
        patch :update, id: competition, competition: { organizer_ids: "" }
        invalid_competition = assigns(:competition)
        expect(invalid_competition).to be_invalid
        expect(invalid_competition.organizer_ids).to eq ""
        expect(invalid_competition.errors.messages[:delegate_ids]).to eq ["You cannot demote yourself"]
        expect(invalid_competition.errors.messages[:organizer_ids]).to eq ["You cannot demote yourself"]
        expect(competition.reload.organizers).to eq [organizer]
      end
    end

    context "when signed in as board member" do
      let(:board_member) { FactoryGirl.create(:board_member) }

      before :each do
        sign_in board_member
      end

      it "board member can demote oneself" do
        competition.organizers << board_member
        competition.save!

        # Remove ourself as an organizer. This should be allowed, because we're
        # still able to administer results.
        patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: "", receive_registration_emails: true }
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq []
      end

      it "board member can delete a non-visible competition" do
        competition.update_attributes(showAtAll: false)
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(Competition.find_by_id(competition.id)).to be_nil
      end

      it "board member cannot delete a visible competition" do
        competition.update_attributes(showAtAll: true)
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(flash[:danger]).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end
    end

    context "when signed in as delegate" do
      let(:delegate) { FactoryGirl.create(:delegate) }
      before :each do
        competition.delegates << delegate
        sign_in delegate
      end

      it 'can confirm competition' do
        patch :update, id: competition, competition: { name: competition.name }, commit: "Confirm"
        expect(response).to redirect_to edit_competition_path(competition)
        expect(competition.reload.isConfirmed?).to eq true
      end

      it "cannot delete not confirmed, but visible competition" do
        competition.update_attributes(isConfirmed: false, showAtAll: true)
        # Attempt to delete competition. This should not work, because we only allow
        # deletion of (not confirmed and not visible) competitions.
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(flash[:danger]).to eq "Cannot delete a competition that is publicly visible."
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end

      it "cannot delete confirmed competition" do
        competition.update_attributes(isConfirmed: true, showAtAll: false)
        # Attempt to delete competition. This should not work, because we only let
        # delegates deleting unconfirmed competitions.
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(flash[:danger]).to eq "Cannot delete a confirmed competition."
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end

      it "can delete not confirmed and not visible competition" do
        competition.update_attributes(isConfirmed: false, showAtAll: false)
        # Attempt to delete competition. This should work, because we allow
        # deletion of (not confirmed and not visible) competitions.
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(Competition.find_by_id(competition.id)).to be_nil
        expect(response).to redirect_to root_url
      end

      it "can change registration open/close of locked competition" do
        competition.update_attribute(:isConfirmed, true)

        new_open = 1.week.from_now.change(sec: 0)
        new_close = 2.weeks.from_now.change(sec: 0)
        patch :update, id: competition, competition: { registration_open: new_open, registration_close: new_close }
        expect(competition.reload.registration_open).to eq new_open
        expect(competition.reload.registration_close).to eq new_close
      end
    end

    context "when signed in as delegate for a different competition" do
      let(:delegate) { FactoryGirl.create(:delegate) }
      before :each do
        sign_in delegate
      end

      it "cannot delete competition they are not delegating" do
        competition.update_attributes(isConfirmed: false, showAtAll: true)
        # Attempt to delete competition. This should not work, because we're
        # not the delegate for this competition.
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(Competition.find_by_id(competition.id)).not_to be_nil
      end
    end
  end

  describe 'GET #post_announcement' do
    context 'when signed in as results team member' do
      sign_in { FactoryGirl.create(:results_team) }

      it 'creates an announcement post' do
        competition.update_attributes(start_date: "2011-12-04", end_date: "2011-12-05")
        get :post_announcement, id: competition
        post = assigns(:post)
        expect(post.title).to eq "#{competition.name} on December 4 - 5, 2011 in #{competition.cityName}, #{competition.countryId}"
        expect(post.body).to match /in #{competition.cityName}, #{competition.countryId}\./
      end

      it 'handles nil start date' do
        competition.update_attributes(start_date: "", end_date: "")
        get :post_announcement, id: competition
        post = assigns(:post)
        expect(post.title).to match /unscheduled/
      end
    end
  end

  describe 'GET #post_announcement' do
    context 'when signed in as results team member' do
      sign_in { FactoryGirl.create(:results_team) }

      it "creates a results post" do
        Result.create!(
          pos: 1,
          personId: "2006SHEU01",
          personName: "Vincent Sheu",
          countryId: "USA",
          competitionId: competition.id,
          eventId: "333fm",
          roundId: "f",
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
          roundId: "f",
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
          roundId: "f",
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
          roundId: "1",
          formatId: "m",
          value1: 4100,
          value2: 5100,
          value3: 6100,
          best: 4100,
          average: 5100,
          regionalSingleRecord: "NAR",
          regionalAverageRecord: "",
        )
        get :post_results, id: competition
        post = assigns(:post)
        expect(post.body).to include "World records: Jeremy Fleischman 3x3 one-handed 50.00 (average), Vincent Sheu (2006SHEU01) 3x3 fewest moves 25 (single), 3x3 fewest moves 26.00 (average), Vincent Sheu (2006SHEU02) 2x2 Cube 10.00 (single)"
        expect(post.body).to include "North American records: Jeremy Fleischman 3x3 one-handed 41.00 (single), 3x3 one-handed 40.00 (single)"
        expect(post.title).to include "in #{competition.cityName}, #{competition.countryId}"
      end
    end
  end
end
