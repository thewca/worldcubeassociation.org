require 'rails_helper'

describe Committee do
  it "has a valid factory" do
    committee = FactoryGirl.build :committee
    expect(committee).to be_valid
  end

  it "creates a valid slug" do
    committee = FactoryGirl.create :committee, name: "A Test Committee"
    expect(committee.slug).to eq "a-test-committee"
  end

  it "requires committee name is not greater than 50 characters" do
    committee = FactoryGirl.build :committee, name: "A really long committee name that is greater than 50 characters"
    expect(committee).to be_invalid
    expect(committee.errors.messages[:name]).to eq ["is too long (maximum is 50 characters)"]
  end

  it "requires slug is not greater than 50 characters" do
    committee = FactoryGirl.build :committee, name: "A-really-long-committee-name-that-is-greater-than-50-characters"
    expect(committee).to be_invalid
    expect(committee.errors.messages[:slug]).to eq ["is too long (maximum is 50 characters)"]
  end

  it "rejects invalid committee names" do
    [
      "Committee (with brackets)",
      "Committee^3",
      "Great Committee!",
    ].each do |name|
      expect(FactoryGirl.build(:committee, name: name)).to be_invalid
    end
  end

  it "rejects invalid committee slugs" do
    [
      "slug with spaces)",
      "Committee^3",
      "Great Committee!",
    ].each do |slug|
      committee = FactoryGirl.build(:committee, name: slug)
      committee.update_attributes(slug: slug)
      expect(committee).to be_invalid
    end
  end
end
