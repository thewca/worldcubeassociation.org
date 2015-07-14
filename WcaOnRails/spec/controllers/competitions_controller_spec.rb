require 'rails_helper'

describe CompetitionsController do
  login_admin

  let(:competition) { FactoryGirl.create(:competition, start_date: "2011-12-04", end_date: "2011-12-05") }

  it 'redirects organiser view to organiser view' do
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

  it 'clears showPreregList if not showPreregForm' do
    competition.update_attributes(showPreregForm: true, showPreregList: true)
    patch :update, id: competition, competition: { showPreregForm: false }
    expect(competition.reload.showPreregList).to eq false
  end

  it 'creates an announcement post' do
    get :post_announcement, id: competition
    post = assigns(:post)
    expect(post.title).to match /#{competition.name} on /
    expect(post.title).to match /December 4 - 5, 2011/
    expect(post.title).to match /in #{competition.cityName}, #{competition.countryId}/
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
end
