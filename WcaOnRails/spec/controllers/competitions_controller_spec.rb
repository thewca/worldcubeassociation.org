require 'rails_helper'

describe CompetitionsController do
  sign_in { FactoryGirl.create :admin }

  let(:competition) {
    FactoryGirl.create(
      :competition,
      start_date: "2011-12-04",
      end_date: "2011-12-05",
      showAtAll: true,
    )
  }
  let(:unscheduled_competition) { FactoryGirl.create(:competition, start_date: nil, end_date: nil) }
  let(:competition_with_delegate) { FactoryGirl.create(:competition, delegates: [FactoryGirl.create(:delegate)]) }
  let(:locked_competition) {
    FactoryGirl.create(
      :competition,
      start_date: "2011-12-04",
      end_date: "2011-12-05",
      showAtAll: true,
      isConfirmed: true,
      delegates: [FactoryGirl.create(:delegate)]
    )
  }

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

  it 'creates a new competition' do
    post :create, competition: { id: "Test2015" }
    expect(response).to redirect_to admin_edit_competition_path("Test2015")
    new_comp = assigns(:competition)
    expect(new_comp.id).to eq "Test2015"
  end

  it 'clones a new competition' do
    user1 = FactoryGirl.create(:delegate)
    user2 = FactoryGirl.create(:user)
    user3 = FactoryGirl.create(:user)
    locked_competition.delegates << user1
    locked_competition.organizers << user2
    locked_competition.organizers << user3
    post :create, competition: { id: "Test2015", competition_id_to_clone: locked_competition.id }
    expect(response).to redirect_to admin_edit_competition_path("Test2015")
    new_comp = assigns(:competition)
    expect(new_comp.id).to eq "Test2015"

    new_comp_json = new_comp.as_json
    # When cloning a competition, we don't want to clone its showAtAll and isConfirmed
    # attributes.
    competition_json = locked_competition.as_json.merge("id" => "Test2015", "showAtAll" => false, "isConfirmed" => false)
    expect(new_comp_json).to eq competition_json

    # Cloning a competition should clone its delegates and organizers.
    expect(new_comp.delegates.sort_by(&:id)).to eq locked_competition.delegates.sort_by(&:id)
    expect(new_comp.organizers.sort_by(&:id)).to eq locked_competition.organizers.sort_by(&:id)
  end

  it 'handles nil start date' do
    get :post_announcement, id: unscheduled_competition
    post = assigns(:post)
    expect(post.title).to match /unscheduled/
  end

  it 'creates an announcement post' do
    get :post_announcement, id: competition
    post = assigns(:post)
    expect(post.title).to eq "#{competition.name} on December 4 - 5, 2011 in #{competition.cityName}, #{competition.countryId}"
    expect(post.body).to match /in #{competition.cityName}, #{competition.countryId}\./
  end

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
    # Another Vincent Shue!
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

  it "organizer cannot demote oneself" do
    delegate = FactoryGirl.create(:delegate)
    other_organizer = FactoryGirl.create(:user)
    delegates = [delegate]
    organizers = [delegate, other_organizer]
    patch :update, id: competition, competition: { delegate_ids: delegates.map(&:id).join(","), organizer_ids: organizers.map(&:id).join(",") }
    expect(competition.reload.delegates).to eq delegates
    expect(competition.reload.organizers).to eq organizers

    sign_out :user
    sign_in delegate
    # Remove ourself as a delegate. This should be allowed, because we're
    # still an organizer.
    delegates.pop
    patch :update, id: competition, competition: { delegate_ids: delegates.map(&:id).join(","), organizer_ids: organizers.map(&:id).join(",") }
    expect(competition.reload.delegates).to eq []
    expect(competition.reload.organizers).to eq organizers

    # Attempt to remove ourself as an organizer. This should not be allowed, because
    # we would not be allowed to access the page anymore.
    patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: other_organizer.id.to_s }
    invalid_competition = assigns(:competition)
    expect(invalid_competition).to be_invalid
    expect(invalid_competition.delegate_ids).to eq ""
    expect(invalid_competition.organizer_ids).to eq other_organizer.id.to_s
    expect(invalid_competition.errors.messages[:delegate_ids]).to eq ["You cannot demote yourself"]
    expect(invalid_competition.errors.messages[:organizer_ids]).to eq ["You cannot demote yourself"]
    expect(competition.reload.delegates).to eq delegates
    expect(competition.reload.organizers).to eq organizers
  end

  it "delegate can enable and disable registration list of locked competition" do
    sign_out :user
    sign_in locked_competition.delegates[0]

    # Disable registration list
    patch :update, id: locked_competition, competition: { showPreregList: "1" }
    expect(locked_competition.reload.showPreregList).to eq true
  end

  it "board member can demote oneself" do
    board_member = FactoryGirl.create(:board_member)
    sign_out :user
    sign_in board_member

    competition.organizers << board_member
    competition.save!

    # Remove ourself as an organizer. This should be allowed, because we're
    # still able to administer results.
    patch :update, id: competition, competition: { delegate_ids: "", organizer_ids: "" }
    expect(competition.reload.delegates).to eq []
    expect(competition.reload.organizers).to eq []
  end

  it "board member can delete competition" do
    board_member = FactoryGirl.create(:board_member)
    sign_out :user
    sign_in board_member

    # Attempt to delete competition. This should not work, because we only allow
    # results admins to delete competitions.
    patch :update, id: competition_with_delegate, competition: { name: competition_with_delegate.name }, commit: "Delete"
    expect(Competition.find_by_id(competition_with_delegate.id)).to be_nil
  end

  it "delegate cannot delete competition" do
    sign_out :user
    sign_in competition_with_delegate.delegates[0]

    # Attempt to delete competition. This should not work, because we only allow
    # results admins to delete competitions.
    patch :update, id: competition_with_delegate, competition: { name: competition_with_delegate.name }, commit: "Delete"
    expect(Competition.find(competition_with_delegate.id)).not_to be_nil
  end

  it "saving removes nonexistent delegates" do
    invalid_competition_delegate = CompetitionDelegate.create!(competition_id: competition_with_delegate.id, delegate_id: 2000000)
    patch :update, id: competition_with_delegate, competition: { name: competition_with_delegate.name }
    expect(CompetitionDelegate.find_by_id(invalid_competition_delegate.id)).to be_nil
  end

  it "saving removes nonexistent organizers" do
    invalid_competition_organizer = CompetitionOrganizer.create!(competition_id: competition.id, organizer_id: 2000000)
    patch :update, id: competition, competition: { name: competition.name }
    expect(CompetitionDelegate.find_by_id(invalid_competition_organizer.id)).to be_nil
  end
end
