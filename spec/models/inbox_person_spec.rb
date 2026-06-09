# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InboxPerson do
  describe '#registration_mismatches' do
    let(:competition) { create(:competition) }
    let(:user) { create(:user, name: "John Doe", country_iso2: "US", gender: "m", dob: Date.new(1990, 6, 15)) }
    let(:registration) { create(:registration, competition: competition, user: user) }
    let(:inbox_person) { create(:inbox_person, competition_id: competition.id, ref_id: registration.registrant_id.to_s, name: user.name, country_iso2: user.country_iso2, gender: user.gender, dob: user.dob) }

    it 'returns an empty array when there is no registration' do
      person = create(:inbox_person, competition_id: competition.id)
      expect(person.registration_mismatches).to eq []
    end

    it 'returns an empty array when all fields match' do
      expect(inbox_person.registration_mismatches).to eq []
    end

    it 'reports a name mismatch' do
      inbox_person.name = "Jane Doe"
      expect(inbox_person.registration_mismatches).to eq ["Full name ('Jane Doe' VS 'John Doe')"]
    end

    it 'reports a country mismatch' do
      inbox_person.country_iso2 = "GB"
      expect(inbox_person.registration_mismatches).to eq ["Representing ('GB' VS 'US')"]
    end

    it 'reports a gender mismatch' do
      inbox_person.gender = "f"
      expect(inbox_person.registration_mismatches).to eq ["Gender ('f' VS 'm')"]
    end

    it 'reports a dob mismatch' do
      inbox_person.dob = Date.new(1991, 7, 20)
      expect(inbox_person.registration_mismatches).to eq ["Birthdate ('1991-07-20' VS '1990-06-15')"]
    end

    it 'reports a WCA ID mismatch' do
      inbox_person.wca_id = "2015WXYZ01"
      expect(inbox_person.registration_mismatches).to eq ["WCA ID ('2015WXYZ01' VS '')"]
    end

    it 'reports multiple mismatches at once' do
      inbox_person.name = "Jane Doe"
      inbox_person.country_iso2 = "GB"
      expect(inbox_person.registration_mismatches).to eq [
        "Full name ('Jane Doe' VS 'John Doe')",
        "Representing ('GB' VS 'US')",
      ]
    end
  end
end
