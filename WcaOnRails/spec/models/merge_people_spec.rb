require 'rails_helper'

describe MergePeople do
  let(:person1) { FactoryGirl.create(:person) }
  let(:person2) { FactoryGirl.create(:person,
                                     name: person1.name,
                                     countryId: person1.countryId,
                                     gender: person1.gender,
                                     year: person1.year,
                                     month: person1.month,
                                     day: person1.day)
  }
  let(:merge_people) { MergePeople.new(person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id) }

  it "is valid" do
    expect(merge_people).to be_valid
  end

  it "requires different people" do
    merge_people.person2_wca_id = merge_people.person1_wca_id
    expect(merge_people).to be_invalid
  end

  it "requires person1 not have multiple subIds" do
    person = FactoryGirl.create(:person_with_multiple_sub_ids)
    merge_people.person1_wca_id = person.wca_id
    expect(merge_people).to be_invalid
    expect(merge_people.errors.messages[:person1_wca_id]).to include "This person has multiple subIds"
  end

  it "requires person2 not have multiple subIds" do
    person = FactoryGirl.create(:person_with_multiple_sub_ids)
    merge_people.person2_wca_id = person.wca_id
    expect(merge_people).to be_invalid
    expect(merge_people.errors.messages[:person2_wca_id]).to include "This person has multiple subIds"
  end

  it "requires same name" do
    person2.update_attribute(:name, "Some other name")
    expect(merge_people).to be_invalid
    expect(merge_people.errors.messages[:person2_wca_id]).to eq ["Names don't match"]
  end

  it "requires same country" do
    person2.update_attribute(:countryId, "Israel")
    expect(merge_people).to be_invalid
    expect(merge_people.errors.messages[:person2_wca_id]).to eq ["Countries don't match"]
  end

  it "requires same gender" do
    person2.update_attribute(:gender, {"m"=>"f", "f"=>"m"}[person1.gender])
    expect(merge_people).to be_invalid
    expect(merge_people.errors.messages[:person2_wca_id]).to eq ["Genders don't match"]
  end

  it "requires same dob" do
    person2.update_attribute(:year, person1.year + 1)
    expect(merge_people).to be_invalid
    expect(merge_people.errors.messages[:person2_wca_id]).to eq ["Birthdays don't match"]
  end

  it "handles invalid wca_id" do
    merge_people.person1_wca_id = "FOOBAR"
    expect(merge_people).to be_invalid
  end

  it "can actually merge people" do
    result1 = FactoryGirl.create(:result, person: person1)
    result2 = FactoryGirl.create(:result, person: person2)
    decoy_result = FactoryGirl.create(:result)

    old_decoy_personId = decoy_result.personId
    expect(merge_people.do_merge).to eq true
    expect(result1.reload.personId).to eq person1.wca_id
    expect(result2.reload.personId).to eq person1.wca_id
    expect(decoy_result.reload.personId).to eq old_decoy_personId
  end
end
