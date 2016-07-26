require 'rails_helper'

RSpec.describe Result do
  it "defines a valid result" do
    result = FactoryGirl.build :result
    expect(result).to be_valid
  end

  it "formats best just seconds" do
    result = FactoryGirl.build :result, best: 4242
    expect(result.to_s :best).to eq "42.42"
  end

  it "formats best minutes" do
    result = FactoryGirl.build :result, best: 3*60*100 + 4242
    expect(result.to_s :best).to eq "3:42.42"
  end

  it "formats best hours" do
    result = FactoryGirl.build :result, best: 2*60*100*60 + 3*60*100 + 4242
    expect(result.to_s :best).to eq "2:03:42.42"
  end

  describe "333fm" do
    it "formats best" do
      result = FactoryGirl.build :result, eventId: "333fm", best: 32
      expect(result.to_s :best).to eq "32"
    end

    it "formats average" do
      result = FactoryGirl.build :result, eventId: "333fm", average: 3267
      expect(result.to_s :average).to eq "32.67"

      result.update_attribute(:average, 2500)
      expect(result.to_s :average).to eq "25.00"
    end
  end

  describe "333mbf" do
    it "formats best" do
      result = FactoryGirl.build :result, eventId: "333mbf", best: 580325400
      expect(result.to_s :best).to eq "41/41 54:14"
    end
  end

  describe "333mbo" do
    it "formats best" do
      result = FactoryGirl.build :result, eventId: "333mbo", best: 1960706900
      expect(result.to_s :best).to eq "3/7 1:55:00"
    end

    it "handles missing times" do
      result = FactoryGirl.build :result, eventId: "333mbo", best: 969999900
      expect(result.to_s :best).to eq "3/3 ?:??:??"
    end
  end

  describe "person association" do
    it "always looks for subId 1" do
      person1 = FactoryGirl.create :person_with_multiple_sub_ids
      person2 = Person.find_by!(wca_id: person1.wca_id, subId: 2)
      result1 = FactoryGirl.create :result, person: person1
      result2 = FactoryGirl.create :result, person: person2
      expect(result1.person).to eq person1
      expect(result2.person).to eq person1
    end
  end
end
