after "development:users", "development:persons" do
  delegate = User.find_by(delegate_status: "delegate")
  day = 1.day.ago
  eventIds = ["333", "333oh", "magic"]
  competition = Competition.create!(
    id: "MyComp#{day.year}",
    name: "My Best Comp #{day.year}",
    cellName: "My Comp #{day.year}",
    cityName: "San Francisco",
    countryId: "USA",
    information: "Information!",
    start_date: day.strftime("%F"),
    end_date: day.strftime("%F"),
    eventSpecs: eventIds.join(" "),
    wcaDelegate: delegate.name,
    organiser: delegate.name,
    venue: "My backyard",
    website: "worldcubeassociation.org",
    showAtAll: true,
  )

  person = Person.all.sample
  Result.create!(
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

  day = 1000.years.since
  eventIds = ["333", "333oh", "magic"]
  future_competition = Competition.create!(
    id: "MyComp#{day.year}",
    name: "My Best Comp #{day.year}",
    cellName: "My Comp #{day.year}",
    cityName: "San Francisco",
    countryId: "USA",
    information: "Information!",
    start_date: day.strftime("%F"),
    end_date: day.strftime("%F"),
    eventSpecs: eventIds.join(" "),
    wcaDelegate: delegate.name,
    organiser: delegate.name,
    venue: "My backyard",
    website: "worldcubeassociation.org",
    showAtAll: true,
  )

  4.times do |i|
    Registration.create!(
      competition: future_competition,
      name: "Bob #{i}",
      personId: "1994BOBY01",
      countryId: "USA",
      gender: "m",
      birthYear: 1990,
      birthMonth: 6,
      birthDay: 4,
      email: "bob@bob.com",
      guests: "",
      comments: "",
      ip: "1.1.1.1",
      status: "",
      eventIds: eventIds.sample(i).join(" "),
    )
  end
end
