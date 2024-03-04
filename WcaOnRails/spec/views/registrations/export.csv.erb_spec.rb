# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/export.csv.erb" do
  let(:competition) { FactoryBot.create :competition, :registration_open }
  let!(:user) {
    FactoryBot.create(
      :user,
      name: "Bob",
      country_iso2: "US",
      dob: Date.new(1990, 1, 1),
      gender: "m",
      email: "bob@bob.com",
    ).tap do |user|
      FactoryBot.create(
        :registration,
        competition: competition,
        accepted_at: Time.now,
        created_at: Time.utc(2014, 3, 14, 15, 16, 17),
        user: user,
        competition_events: [competition.competition_events.find_by!(event_id: "333")],
        guests: 1,
      )
    end
  }

  it "renders valid csv" do
    assign(:competition, competition)
    assign(:registrations, competition.registrations)
    render

    expect(rendered).to eq "Status,Name,Country,WCA ID,Birth Date,Gender,333,333oh,Email,Guests,IP,Registration Date Time (UTC)\na,Bob,USA,,1990-01-01,m,1,0,bob@bob.com,1,\"\",2014-03-14 15:16:17 UTC\n"
  end

  it "renders null (missing) gender as empty string" do
    user.update!(gender: nil)

    assign(:competition, competition)
    assign(:registrations, competition.registrations)
    render

    expect(rendered).to eq "Status,Name,Country,WCA ID,Birth Date,Gender,333,333oh,Email,Guests,IP,Registration Date Time (UTC)\na,Bob,USA,,1990-01-01,,1,0,bob@bob.com,1,\"\",2014-03-14 15:16:17 UTC\n"
  end
end
