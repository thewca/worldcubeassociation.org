# frozen_string_literal: true

FactoryBot.define do
  factory :inbox_person do
    # The InboxPerson's (competitionId, id) must be unique,
    # and id is not the usual auto increment integer (it's actually a varchar!)
    # Therefore we make the simple choice of always setting the id based on
    # what is present in the db.
    # 'maximum(:id).to_i' always work: either it's nil and returns 0, or it just
    # returns the appropriate number.
    id { (InboxPerson.maximum(:id).to_i + 1) }
    wcaId { "" }
    name { Faker::Name.name }
    countryId { Country.real.sample.iso2 }
    gender { "m" }
    dob { Date.new(1966, 4, 4) }
  end
end
