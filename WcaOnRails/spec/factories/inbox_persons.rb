# frozen_string_literal: true

FactoryBot.define do
  factory :inbox_person do
    # The InboxPerson's (competitionId, id) must be unique,
    # and id is not the usual auto increment integer (it's actually a varchar!)
    # Therefore we make the simple choice of always setting the id based on
    # what is present in the db.
    # Since id is a varchar, `maximum(:id)` only works up to "9"...
    # Therefore we must do the max logic in RoR's world after casting.
    id { ((InboxPerson.pluck(:id).map(&:to_i).max || 0) + 1) }
    wcaId { "" }
    name { Faker::Name.name.gsub(" DVM", "") } # DVM removed to prevent unwanted warnings (we don't allow titles as suffixes)
    countryId { Country.real.sample.iso2 }
    gender { "m" }
    dob { Date.new(1966, 4, 4) }
  end
end
