# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AnonymizePerson do
  let(:person) { FactoryBot.create(:person_who_has_competed_once, wca_id: "2020EXAM01") }
  let(:anonymize_person) { AnonymizePerson.new(person_wca_id: person.wca_id) }

  let(:user) { FactoryBot.create(:user, :wca_id) }
  let(:anonymize_person2) { AnonymizePerson.new(person_wca_id: user.wca_id) }

  it "is valid" do
    expect(anonymize_person).to be_valid
  end

  it "handles invalid wca_id" do
    anonymize_person.person_wca_id = ""
    expect(anonymize_person).to be_invalid_with_errors(person_wca_id: ["can't be blank"])
  end

  it "generates a wca id for ANON with the same year" do
    expect(anonymize_person.generate_new_wca_id).to eq "2020ANON01"
  end

  it "generates padded wca id for a year with 99 ANON ids already" do
    (1..99).each do |i|
      FactoryBot.create(:person_who_has_competed_once, wca_id: "2020ANON" + i.to_s.rjust(2, "0"))
    end

    expect(anonymize_person.generate_new_wca_id).to eq "2020ANOU01" # ANON, take the last N, pad with U.
  end

  it "can anonymize person and results" do
    result = FactoryBot.create(:result, person: person)

    response = anonymize_person.do_anonymize_person
    expect(!!response).to eq true
    expect(result.reload.personId).to eq "2020ANON01"
    expect(result.reload.personName).to eq "Anonymous"
    expect(person.reload.wca_id).to eq "2020ANON01"
    expect(person.reload.name).to eq "Anonymous"
    expect(person.reload.gender).to eq "o"
    expect(person.reload.dob).to eq nil
  end

  it "can anonymize account data" do
    FactoryBot.create(:result, person: user.person)

    response = anonymize_person2.do_anonymize_person
    expect(!!response).to eq true
    expect(user.reload.wca_id).to eq nil
    expect(user.reload.email).to eq user.id.to_s + "@worldcubeassociation.org"
    expect(user.reload.name).to eq "Anonymous"
    expect(user.reload.dob).to eq nil
    expect(user.reload.gender).to eq "o"
  end
end
