require 'rails_helper'

describe Team do
  it "has a valid factory" do
    expect(FactoryGirl.build(:team)).to be_valid
  end

  it "creates a valid slug" do
    team = FactoryGirl.create :team, name: "A Test Team"
    expect(team.slug).to eq "a-test-team"
  end

  it "requires team name is not greater than 50 characters" do
    team = FactoryGirl.build :team, name: "A really long team name that is greater than 50 characters"
    expect(team).to be_invalid
    expect(team.errors.messages[:name]).to eq ["is too long (maximum is 50 characters)"]
  end

  it "requires slug is not greater than 50 characters" do
    team = FactoryGirl.build :team, name: "A-really-long-team-name-that-is-greater-than-50-characters"
    expect(team).to be_invalid
    expect(team.errors.messages[:slug]).to eq ["is too long (maximum is 50 characters)"]
  end

  it "rejects invalid team names" do
    [
      "Team (with brackets)",
      "Team^3",
      "Great Team!",
    ].each do |name|
      expect(FactoryGirl.build(:team, name: name)).to be_invalid
    end
  end
  it "rejects invalid team slugs" do
    [
      "slug with spaces)",
      "Team^3",
      "Great Team!",
    ].each do |slug|
      team = FactoryGirl.build(:team, name: slug)
      team.update_attributes(slug: slug)
      expect(team).to be_invalid
    end
  end
end
