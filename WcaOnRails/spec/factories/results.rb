FactoryGirl.define do
  factory :result do
    transient do
      person { FactoryGirl.create(:person) }
    end

    personId { person.wca_id }
    personName { person.name }
    countryId { person.countryId }
    competitionId "USNationals2010"
    pos 1
    eventId "333oh"
    roundId "f"
    formatId "a"
    value1 3000
    value2 4000
    value3 5000
    value4 6000
    value5 7000
    best 3000
    average 5000
    regionalSingleRecord ""
    regionalAverageRecord ""
  end
end
