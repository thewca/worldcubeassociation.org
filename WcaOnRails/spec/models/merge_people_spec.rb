# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MergePeople do
  let(:person1) { FactoryBot.create(:person, country_id: "USA") }
  let(:shared_attributes) { person1.attributes.symbolize_keys.slice(:name, :country_id, :gender, :dob) }
  let(:person2) { FactoryBot.create(:person, shared_attributes) }
  let(:merge_people) { MergePeople.new(person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id) }

  it "is valid" do
    expect(merge_people).to be_valid
  end

  it "requires different people" do
    merge_people.person2_wca_id = merge_people.person1_wca_id
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["Cannot merge a person with themself!"])
  end

  it "requires person1 not have multiple sub_ids" do
    merge_people.person1_wca_id = FactoryBot.create(:person_with_multiple_sub_ids, shared_attributes).wca_id
    expect(merge_people).to be_invalid_with_errors(person1_wca_id: ["This person has multiple sub_ids"])
  end

  it "requires person2 not have multiple sub_ids" do
    merge_people.person2_wca_id = FactoryBot.create(:person_with_multiple_sub_ids, shared_attributes).wca_id
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["This person has multiple sub_ids"])
  end

  it "requires same name" do
    person2.update_attribute(:name, "Some other name")
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["Names don't match"])
  end

  it "requires same country" do
    person2.update_attribute(:country_id, "Israel")
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["Countries don't match"])
  end

  it "requires same gender" do
    person2.update_attribute(:gender, { "m"=>"f", "f"=>"m" }[person1.gender])
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["Genders don't match"])
  end

  it "requires same dob" do
    person2.update_attribute(:dob, person1.dob + 1.year)
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["Birthdays don't match"])
  end

  it "handles invalid wca_id" do
    merge_people.person1_wca_id = "FOOBAR"
    expect(merge_people).to be_invalid_with_errors(person1_wca_id: ["Not found"])
  end

  it "requires person2 to not have an account" do
    FactoryBot.create :user, :wca_id, person: person2
    expect(merge_people).to be_invalid_with_errors(person2_wca_id: ["Must not have an account"])
  end

  it "can actually merge people" do
    result1 = FactoryBot.create(:result, person: person1)
    result2 = FactoryBot.create(:result, person: person2)
    decoy_result = FactoryBot.create(:result)

    old_decoy_personId = decoy_result.personId
    expect(merge_people.do_merge).to eq true
    expect(result1.reload.personId).to eq person1.wca_id
    expect(result2.reload.personId).to eq person1.wca_id
    expect(decoy_result.reload.personId).to eq old_decoy_personId
  end
end
