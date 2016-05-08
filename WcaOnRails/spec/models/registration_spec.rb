require 'rails_helper'

RSpec.describe Registration do
  let(:registration) { FactoryGirl.create :registration }

  it "defines a valid registration" do
    expect(registration).to be_valid
  end

  it "requires a competitionId" do
    registration.competitionId = nil
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["Competition not found"]
  end

  it "requires a valid competitionId" do
    registration.competitionId = "foobar"
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["Competition not found"]
  end

  it "cannot create a registration for a competition without wca registration" do
    competition = FactoryGirl.create(:competition, use_wca_registration: false)
    reg = FactoryGirl.build :registration, competition: competition
    expect(reg).to be_invalid
    expect(reg.errors.messages[:competition]).to eq ["Competition registration is closed"]
  end

  it "allows no user on update" do
    registration.user_id = nil
    expect(registration).to be_valid
  end

  it "requires user on create" do
    expect(FactoryGirl.build(:registration, user_id: nil)).to be_invalid
  end

  it "requires country" do
    user = FactoryGirl.create(:user, country_iso2: nil)
    registration.user = user
    expect(registration).to be_invalid
  end

  it "requires gender" do
    user = FactoryGirl.create(:user, gender: nil)
    registration.user = user
    expect(registration).to be_invalid
  end

  it "requires dob" do
    user = FactoryGirl.create(:user, dob: nil)
    registration.user = user
    expect(registration).to be_invalid
  end

  it "requires at least one event" do
    registration.registration_events = []
    expect(registration).to be_invalid
    expect(registration.errors[:registration_events]).to eq ["must register for at least one event"]
  end

  it "requires events be offered by competition" do
    registration.registration_events.build(event_id: "777")
    expect(registration).to be_invalid
  end

  it "handles a changing user" do
    registration.user.update_column(:name, "New Name")
    expect(registration.name).to eq "New Name"
  end

  it "requires quests >= 0" do
    registration.guests = -5
    expect(registration).to be_invalid
    expect(registration.errors.messages[:guests]).to eq ["must be greater than or equal to 0"]
  end
end
