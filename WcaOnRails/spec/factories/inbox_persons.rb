# frozen_string_literal: true

FactoryBot.define do
  factory :inbox_person do
    # The InboxPerson's (competition_id, id) must be unique,
    # and id is not the usual auto increment integer (it's actually a varchar!)
    # Therefore we make the simple choice of always setting the id based on
    # what is present in the db.
    # Since id is a varchar, `maximum(:id)` only works up to "9"...
    # Therefore we must do the max logic in RoR's world after casting.
    id { ((InboxPerson.pluck(:id).map(&:to_i).max || 0) + 1) }
    wca_id { "" }
    name { Faker::Name.name }
    country_iso2 { Country.real.sample.iso2 }
    gender { "m" }
    dob { Date.new(1966, 4, 4) }
  end
end
