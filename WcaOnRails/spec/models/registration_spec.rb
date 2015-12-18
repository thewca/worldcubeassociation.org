require 'rails_helper'

RSpec.describe Registration do
  let(:registration) { FactoryGirl.create :registration }

  it "defines a valid registration" do
    expect(registration).to be_valid
  end

  it "requires a competitionId" do
    registration.competitionId = nil
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competitionId]).to eq ["invalid"]
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
    registration.eventIds = ""
    expect(registration).to be_invalid
    expect(registration.errors[:events]).to eq ["must register for at least one event"]
  end

  it "requires events be offered by competition" do
    registration.eventIds = "777"
    expect(registration).to be_invalid
  end
end
