# frozen_string_literal: true
require "rails_helper"

describe "registrations/export.csv.erb" do
  it "renders valid csv" do
    competition = FactoryGirl.create :competition, :registration_open
    user = FactoryGirl.create(
      :user,
      name: "Bob",
      country_iso2: "US",
      dob: Date.new(1990, 1, 1),
      gender: "m",
      email: "bob@bob.com",
    )
    FactoryGirl.create(
      :registration,
      competition: competition,
      accepted_at: Time.now,
      user: user,
      competition_events: [ competition.competition_events.find_by!(event_id: "333") ],
      guests: 1,
    )
    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render
    expect(rendered).to eq "Status,Name,Country,WCA ID,Birth Date,Gender,333,333oh,Email,Guests,IP\na,Bob,USA,,1990-01-01,m,1,0,bob@bob.com,1,\"\"\n"
  end
end
