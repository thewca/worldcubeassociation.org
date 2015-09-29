require 'rails_helper'

RSpec.describe Registration do
  let(:competition) { FactoryGirl.create :competition }

  it "defines a valid registration" do
    registration = FactoryGirl.build :registration, competitionId: competition.id
    expect(registration).to be_valid
  end

  it "requires a competitionId" do
    registration = FactoryGirl.build :registration
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competitionId]).to eq ["invalid"]
  end

  it "validates dates" do
    registration = FactoryGirl.build :registration, competitionId: competition.id, birthday: "2015-04-33"
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:birthday]).to eq ["invalid"]
  end
end
