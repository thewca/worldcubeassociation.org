# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Registration do
  let(:registration) { FactoryGirl.create :registration }

  it "defines a valid registration" do
    expect(registration).to be_valid
  end

  it "requires a competition_id" do
    registration.competition_id = nil
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["Competition not found"]
  end

  it "requires a valid competition_id" do
    registration.competition_id = "foobar"
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["Competition not found"]
  end

  it "cannot create a registration for a competition without wca registration" do
    competition = FactoryGirl.create(:competition, use_wca_registration: false)
    reg = FactoryGirl.build :registration, competition: competition
    expect(reg).to be_invalid_with_errors(competition: ["Competition registration is closed"])
  end

  it "allows no user on update" do
    registration.user_id = nil
    expect(registration).to be_valid
  end

  it "requires user on create" do
    expect(FactoryGirl.build(:registration, user_id: nil)).to be_invalid_with_errors(user: ["can't be blank"])
  end

  it "requires country" do
    user = FactoryGirl.create(:user, country_iso2: nil)
    registration.user = user
    expect(registration).to be_invalid_with_errors(user_id: ["Need a country"])
  end

  it "requires gender" do
    user = FactoryGirl.create(:user, gender: nil)
    registration.user = user
    expect(registration).to be_invalid_with_errors(user_id: ["Need a gender"])
  end

  it "requires dob" do
    user = FactoryGirl.create(:user, dob: nil)
    registration.user = user
    expect(registration).to be_invalid_with_errors(user_id: ["Need a birthdate"])
  end

  it "requires at least one event" do
    registration.registration_competition_events = []
    expect(registration).to be_invalid_with_errors(registration_competition_events: ["must register for at least one event"])
  end

  it "requires events be offered by competition" do
    registration.registration_competition_events.build(competition_event_id: 1234)
    expect(registration).to be_invalid_with_errors(
      "registration_competition_events.competition_event" => ["can't be blank"],
    )
  end

  it "handles a changing user" do
    registration.user.update_column(:name, "New Name")
    expect(registration.name).to eq "New Name"
  end

  it "requires quests >= 0" do
    registration.guests = -5
    expect(registration).to be_invalid_with_errors(guests: ["must be greater than or equal to 0"])
  end
end
