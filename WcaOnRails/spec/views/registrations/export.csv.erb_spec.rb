# frozen_string_literal: true
require "rails_helper"

describe "registrations/export.csv.erb" do
  it "renders valid csv" do
    competition = FactoryGirl.create :competition
    competition.registrations.build(
      accepted_at: Time.now,
      name: "Bob",
      countryId: "USA",
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      gender: "m",
      email: "bob@bob.com",
      events: [ Event.find("333") ],
      guests: 1,
      guests_old: 'jane', # will go away. https://github.com/cubing/worldcubeassociation.org/issues/403
    )
    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render
    expect(rendered).to eq "Status,Name,Country,WCA ID,Birth Date,Gender,333,333oh,Email,Guests,IP\na,Bob,USA,\"\",1990-01-01,m,1,0,bob@bob.com,1 jane,\"\"\n"
  end
end
