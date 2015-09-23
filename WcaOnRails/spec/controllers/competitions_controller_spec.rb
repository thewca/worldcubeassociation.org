require 'rails_helper'

describe CompetitionsController do
  let(:competition) { FactoryGirl.create( :competition) }

  describe 'GET #new' do
    context 'when not signed in' do
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

    context 'when signed in as an delegate' do
      sign_in { FactoryGirl.create :delegate }

      it 'shows the competition creation form' do
        get :new
        expect(response).to render_template :new
      end
    end
  end

  describe 'POST #create' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        post :create, competition: { id: "Test2015" }
        expect(response).to redirect_to new_user_session_path
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

    context 'when signed in as an delegate' do
      let(:delegate) { FactoryGirl.create :delegate }
      before :each do
        sign_in delegate
      end

      it 'creates a new competition' do
        post :create, competition: { name: "Test 2015" }
        expect(response).to redirect_to edit_competition_path("Test2015")
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "Test2015"
        expect(new_comp.delegates).to include subject.current_user
      end

      it 'clones a new competition' do
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
        new_comp = assigns(:competition)
        expect(new_comp.id).to eq "Test2015"

        new_comp_json = new_comp.as_json
        # When cloning a competition, we don't want to clone its showAtAll and isConfirmed
        # attributes.
        competition_json = competition.as_json.merge("id" => "Test2015", "name" => "Test 2015", "cellName" => "Test 2015", "showAtAll" => false, "isConfirmed" => false)
        expect(new_comp_json).to eq competition_json

        # Cloning a competition should clone its organizers.
        expect(new_comp.organizers.sort_by(&:id)).to eq competition.organizers.sort_by(&:id)
        # When a delegate clones a competition, it should clone its organizers, and add
        # the delegate doing the cloning.
        expect(new_comp.delegates.sort_by(&:id)).to eq (competition.delegates + [delegate]).sort_by(&:id)
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
        patch :update, id: competition, competition: { name: competition.name }, admin_view: true
        expect(response).to redirect_to admin_edit_competition_path(competition)
      end

      it 'renders admin view when failing to save admin view' do
        patch :update, id: competition, competition: { name: "fooo" }, admin_view: true
        expect(response).to render_template :edit
        admin_view = assigns(:admin_view)
        expect(admin_view).to be true
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
        invalid_competition_delegate = CompetitionDelegate.create!(competition_id: competition.id, delegate_id: 2000000)
        patch :update, id: competition, competition: { name: competition.name }
        expect(CompetitionDelegate.find_by_id(invalid_competition_delegate.id)).to be_nil
      end

      it "saving removes nonexistent organizers" do
        invalid_competition_organizer = CompetitionOrganizer.create!(competition_id: competition.id, organizer_id: 2000000)
        patch :update, id: competition, competition: { name: competition.name }
        expect(CompetitionDelegate.find_by_id(invalid_competition_organizer.id)).to be_nil
      end

      it "changing the competition id also changes the competitionId of registrations, results, and scrambles" do
        r1 = FactoryGirl.create(:result, competitionId: competition.id)
        r2 = FactoryGirl.create(:result, competitionId: competition.id)
        reg1 = FactoryGirl.create(:registration, competitionId: competition.id)
        scramble1 = FactoryGirl.create(:scramble, competitionId: competition.id)
        patch :update, id: competition, competition: { id: "NewID2015" }
        expect(r1.reload.competitionId).to eq "NewID2015"
        expect(r2.reload.competitionId).to eq "NewID2015"
        expect(reg1.reload.competitionId).to eq "NewID2015"
        expect(scramble1.reload.competitionId).to eq "NewID2015"
      end
    end

    context 'when signed in as organizer' do
      let(:organizer) { FactoryGirl.create(:delegate) }
      before :each do
        competition.organizers << organizer
        competition.save
        sign_in organizer
      end

      it "who is also the delegate can remove oneself as delegate" do
        # First, make the organizer of the competition the delegate of the competition.
        competition.delegates << organizer
        competition.save

        # Remove ourself as a delegate. This should be allowed, because we're
        # still an organizer.
        patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: organizer.id }
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq [organizer]
      end

      it "organizer cannot demote oneself" do
        # Attempt to remove ourself as an organizer. This should not be allowed, because
        # we would not be allowed to access the page anymore.
        patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: "" }
        invalid_competition = assigns(:competition)
        expect(invalid_competition).to be_invalid
        expect(invalid_competition.delegate_ids).to eq ""
        expect(invalid_competition.organizer_ids).to eq ""
        expect(invalid_competition.errors.messages[:delegate_ids]).to eq ["You cannot demote yourself"]
        expect(invalid_competition.errors.messages[:organizer_ids]).to eq ["You cannot demote yourself"]
        expect(competition.reload.delegates).to eq []
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
        patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: "" }
        expect(competition.reload.delegates).to eq []
        expect(competition.reload.organizers).to eq []
      end

      it "board member can delete competition" do
        # Attempt to delete competition. This should work.
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(Competition.find_by_id(competition.id)).to be_nil
      end
    end

    context "when signed in as delegate" do
      let(:delegate) { FactoryGirl.create(:delegate) }
      before :each do
        competition.delegates << delegate
        sign_in delegate
      end

      it "cannot delete competition" do
        # Attempt to delete competition. This should not work, because we only allow
        # results admins to delete competitions.
        patch :update, id: competition, competition: { name: competition.name }, commit: "Delete"
        expect(Competition.find(competition.id)).not_to be_nil
      end

      it "can enable and disable registration list of locked competition" do
        competition.update_attribute(:isConfirmed, true)
        # Disable registration list
        patch :update, id: competition, competition: { showPreregList: "1" }
        expect(competition.reload.showPreregList).to eq true
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
      end
    end
  end
end
