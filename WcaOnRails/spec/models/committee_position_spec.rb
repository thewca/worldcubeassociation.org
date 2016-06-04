require 'rails_helper'

RSpec.describe CommitteePosition, type: :model do
  it "has a valid factory" do
    expect(FactoryGirl.build(:committee_position)).to be_valid
  end

  it "requires name is not greater than 50 characters" do
    position = FactoryGirl.build :committee_position, name: "A really long committee position name that is greater than 50 characters"
    expect(position).to be_invalid
    expect(position.errors.messages[:name]).to eq ["is too long (maximum is 50 characters)"]
  end

  it "rejects invalid names" do
    [
      "Position (with brackets)",
      "Position^3",
      "Great Position!",
    ].each do |name|
      expect(FactoryGirl.build(:committee_position, name: name)).to be_invalid
    end
  end

  context "when assigning positions to a single committee" do
    let(:committee) { FactoryGirl.build :committee }

    it "cannot create two positions with the same name" do
      position1 = FactoryGirl.create :committee_position, name: "Team Leader", committee: committee
      expect(position1).to be_valid
      position2 = FactoryGirl.build :committee_position, name: "Team Leader", committee: committee
      expect(position2).to be_invalid
      expect(position2.errors.messages[:name]).to eq ["has already been taken"]
      expect(position2.errors.messages[:slug]).to eq ["has already been taken"]
    end
  end

  context "when assigning positions to different committees" do
    let(:committee1) { FactoryGirl.build :committee }
    let(:committee2) { FactoryGirl.build :committee }

    it "can create two positions with the same name" do
      position1 = FactoryGirl.create :committee_position, name: "Team Leader", committee: committee1
      expect(position1).to be_valid
      position2 = FactoryGirl.build :committee_position, name: "Team Leader", committee: committee2
      expect(position2).to be_valid
    end
  end
end
