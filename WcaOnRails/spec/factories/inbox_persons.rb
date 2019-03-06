# frozen_string_literal: true

FactoryBot.define do
  factory :inbox_person do
    # The InboxPerson's (competitionId, id) must be unique,
    # and id is not the usual auto increment integer.
    # Therefore we make the simple choice of always setting the id based on
    # what is present in the db.
    id { (InboxPerson.maximum(:id) || 0) + 1 }
    wcaId { "" }
    name { Faker::Name.name }
    countryId { Country.real.sample.iso2 }
    gender { "m" }
    dob { Date.new(1966, 4, 4) }
  end
end
