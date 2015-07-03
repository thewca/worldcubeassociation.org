require 'rails_helper'

RSpec.describe Competition, type: :model do
  it "defines a valid competition" do
    competition = FactoryGirl.build :competition
    expect(competition).to be_valid
  end

  it "requires that name end in a year" do
    competition = FactoryGirl.build :competition, name: "Name without year"
    expect(competition).to be_invalid
  end

  it "requires that cellName end in a year" do
    competition = FactoryGirl.build :competition, cellName: "Name no year"
    expect(competition).to be_invalid
  end

  it "populates year, month, day, endMonth, endDay" do
    competition = FactoryGirl.create :competition
    competition.start_date = "1987-11-06"
    competition.end_date = "1987-12-07"
    competition.save!
    expect(competition.year).to eq 1987
    expect(competition.month).to eq 11
    expect(competition.day).to eq 6
    expect(competition.endMonth).to eq 12
    expect(competition.endDay).to eq 7
  end

  it "requires that both dates are empty or both are valid" do
    competition = FactoryGirl.create :competition
    competition.start_date = "1987-12-04"
    expect(competition).to be_invalid

    competition.end_date = "1987-12-05"
    expect(competition).to be_valid
  end

  it "requires that the start is before the end" do
    competition = FactoryGirl.create :competition
    competition.start_date = "1987-12-06"
    competition.end_date = "1987-12-05"
    expect(competition).to be_invalid
  end

  it "requires that competition starts and ends in the same year" do
    competition = FactoryGirl.create :competition
    competition.start_date = "1987-12-06"
    competition.end_date = "1988-12-07"
    expect(competition).to be_invalid
  end

  it "knows the calendar" do
    competition = FactoryGirl.create :competition
    competition.start_date = "1987-0-04"
    competition.end_date = "1987-12-05"
    expect(competition).to be_invalid

    competition.start_date = "1987-4-04"
    competition.end_date = "1987-33-05"
    expect(competition).to be_invalid
  end

  it "gracefully handles multiyear competitions" do
    competition = FactoryGirl.create :competition
    competition.start_date = "1987-11-06"
    competition.end_date = "1988-12-07"
    competition.save
    expect(competition).to be_invalid
    expect(competition.end_date).to eq "1988-12-07"
  end

  it "ignores equal signs in eventSpecs" do
    # See https://github.com/cubing/worldcubeassociation.org/issues/95
    competition = FactoryGirl.build :competition, eventSpecs: "   333=//sd    444   "
    expect(competition.events.map(&:id)).to eq [ "333", "444" ]
  end

  it "validates event ids" do
    competition = FactoryGirl.build :competition, eventSpecs: "333 333wtf"
    expect(competition).to be_invalid
  end

  it "converts microdegrees to degrees" do
    competition = FactoryGirl.build :competition, latitude: 40, longitude: 30
    expect(competition.latitude_degrees).to eq 40/1e6
    expect(competition.longitude_degrees).to eq 30/1e6
  end

  it "converts degrees to microdegrees when saving" do
    competition = FactoryGirl.create :competition
    competition.latitude_degrees = 3.5
    competition.longitude_degrees = 4.6
    competition.save!
    expect(competition.latitude).to eq 3.5*1e6
    expect(competition.longitude).to eq 4.6*1e6
  end

  it "parses website" do
    url = "http://foo.com"
    url_name = "foo comp website"
    competition = FactoryGirl.create :competition, website: "[{#{url_name}}{#{url}}]"
    expect(competition.website_url_name).to eq url_name
    expect(competition.website_url).to eq url
  end
end
