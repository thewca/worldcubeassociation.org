require "rails_helper"

RSpec.describe "registrations/psych_sheet_event" do
  it "works" do
    competition = FactoryGirl.create(:competition)
    event = Event.find("333")

    registrations = []

    registrations << FactoryGirl.create(:registration, competition: competition)
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

    # Someone who has never competed before
    registrations << FactoryGirl.create(:registration, user: FactoryGirl.create(:user), competition: competition)

    registrations << FactoryGirl.create(:registration, competition: competition)

    assign(:competition, competition)
    assign(:event, event)
    assign(:registrations, registrations)

    render
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(1) .single", text: /\A20.00\z/)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(2) .single", text: /\A\z/)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(3) .single", text: /\A\z/)
    expect(rendered).to have_css(".wca-results tbody tr:nth-child(3) td.position.tied-previous")
  end
end
