require "rails_helper"

describe "registrations/index.csv.erb" do
  it "renders valid csv" do
    competition = FactoryGirl.create :competition
    competition.registrations.build(
      status: "a",
      name: "Bob",
      countryId: "USA",
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      gender: "m",
      email: "bob@bob.com",
      eventIds: "333",
      guests: "jane\r\nbob",
    )
    assign(:competition, competition)

    render
    expect(rendered).to eq "Status,Name,Country,WCA ID,Birth Date,Gender,333,333oh,Email,Guests,IP\na,Bob,USA,\"\",1990-01-01,m,1,0,bob@bob.com,jane  bob,\"\"\n"
  end
end
