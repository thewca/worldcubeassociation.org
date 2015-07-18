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
    delegates: [delegate],
    organizers: User.all.sample(2),
  )

  persons = Person.all.sample(3)
  persons.each_with_index do |person, i|
    Result.create!(
      pos: i+1,
      personId: person.id,
      personName: person.name,
      countryId: person.countryId,
      competitionId: competition.id,
      eventId: "333",
      roundId: "f",
      formatId: "a",
      value1: 4242 + i*1000,
      value2: 4242 + i*1000,
      value3: 4242 + i*1000,
      value4: 6000 + i*1000,
      value5: 4000 + i*1000,
      best: 4000 + i*1000,
      average: 4242 + i*1000,
      regionalSingleRecord: i == 0 ? "WR" : "",
      regionalAverageRecord: i == 0 ? "WR" : "",
    )
  end

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
    website: "[{wca}{http://worldcubeassociation.org}]",
    showAtAll: true,
    delegates: [delegate],
    organizers: User.all.sample(2),
  )

  4.times do |i|
    Registration.create!(
      competition: future_competition,
      name: Faker::Name.name,
      personId: "1994BOBY0#{i}",
      countryId: Faker::Address.country,
      gender: "m",
      birthYear: 1990,
      birthMonth: 6,
      birthDay: 4,
      email: Faker::Internet.email,
      guests: (1..10).map { Faker::Name.name }.join(" "),
      comments: Faker::Lorem.paragraph,
      ip: "1.1.1.1",
      status: i % 2 == 0 ? "p" : "a",
      eventIds: eventIds.sample(i).join(" "),
    )
  end
end
