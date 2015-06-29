after "development:users", "development:persons" do
  delegate = User.find_by(delegate_status: "delegate")
  yesterday = 1.day.ago
  competition = Competition.create(
    id: "MyComp#{yesterday.year}",
    name: "My Best Comp #{yesterday.year}",
    cellName: "My Comp #{yesterday.year}",
    cityName: "San Francisco",
    countryId: "USA",
    information: "Information!",
    year: yesterday.year,
    month: yesterday.month,
    day: yesterday.day,
    endMonth: yesterday.month,
    endDay: yesterday.day,
    eventSpecs: "333 333oh",
    wcaDelegate: delegate.name,
    organiser: delegate.name,
    venue: "My backyard",
    website: "worldcubeassociation.org",
    showAtAll: true,
  )

  person = Person.all.sample
  Result.create(
    pos: 1,
    personId: person.id,
    personName: person.name,
    countryId: person.countryId,
    competitionId: competition.id,
    eventId: "333",
    roundId: "f",
    formatId: "a",
    value1: 4242,
    value2: 4242,
    value3: 4242,
    value4: 6000,
    value5: 4000,
    best: 4000,
    average: 4242,
  )
end
