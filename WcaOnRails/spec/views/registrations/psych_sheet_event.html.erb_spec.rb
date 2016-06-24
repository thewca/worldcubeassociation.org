require "rails_helper"

RSpec.describe "registrations/psych_sheet_event" do
  it "works" do
    competition = FactoryGirl.create(:competition, :registration_open)
    event = Event.find("333")
    user1 = FactoryGirl.create(:user, :wca_id, name: "Andrew Apple")
    user2 = FactoryGirl.create(:user, :wca_id, name: "Bill Banana")

    registrations = []

    registrations << FactoryGirl.create(:registration, :accepted, user: user1, competition: competition)
    RanksAverage.create!(
      personId: registrations.last.personId,
      eventId: "333",
      best: "4242",
      worldRank: 10,
      continentRank: 10,
      countryRank: 10,
    )
    RanksSingle.create!(
      personId: registrations.last.personId,
      eventId: "333",
      best: "2000",
      worldRank: 1,
      continentRank: 1,
      countryRank: 1,
    )

    registrations << FactoryGirl.create(:registration, :accepted, user: user2, competition: competition)
    RanksAverage.create!(
      personId: registrations.last.personId,
      eventId: "333",
      best: "4242",
      worldRank: 10,
      continentRank: 10,
      countryRank: 10,
    )
    RanksSingle.create!(
      personId: registrations.last.personId,
      eventId: "333",
      best: "3334",
      worldRank: 23,
      continentRank: 23,
      countryRank: 23,
    )

    # Two users who have never competed before.
    2.times do
      registrations << FactoryGirl.create(:registration, :accepted, user: FactoryGirl.create(:user), competition: competition)
    end

    registrations = competition.psych_sheet_event(event)
    assign(:competition, competition)
    assign(:event, event)
    assign(:preferred_format, event.preferred_formats.first)
    assign(:registrations, registrations)

    render
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(1) .single", text: /\A\s*20.00\s*\z/)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(2) .single", text: /\A\s*33.34\s*\z/)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(2) td.pos.tied-previous", text: 1)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(3) .single", text: /\A\s*\z/)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(4) .single", text: /\A\s*\z/)
  end
end
