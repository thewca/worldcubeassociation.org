after "development:users" do
  delegate = User.find_by(delegate_status: "delegate")

  users = User.where.not(wca_id: nil).sample(93)

  # Create some past competitions with results
  3.times do |i|
    day = i.days.ago
    eventIds = ["333", "333oh", "magic"]
    competition = Competition.create!(
      id: "My#{i}Comp#{day.year}",
      name: "My #{i} Best Comp #{day.year}",
      cellName: "My #{i} Comp #{day.year}",
      cityName: "San Francisco",
      countryId: "USA",
      information: "Information!",
      start_date: day.strftime("%F"),
      end_date: day.strftime("%F"),
      eventSpecs: eventIds.join(" "),
      venue: "My backyard",
      website: "https://www.worldcubeassociation.org",
      showAtAll: true,
      delegates: [delegate],
      organizers: User.all.sample(2),
      use_wca_registration: true,
      registration_open: 2.weeks.ago,
      registration_close: 1.week.ago,
    )

    eventIds.each do |eventId|
      [ "1", "2", "f" ].each do |roundId|
        users.each_with_index do |competitor, i|
          person = competitor.person
          Result.create!(
            pos: i+1,
            personId: person.id,
            personName: person.name,
            countryId: person.countryId,
            competitionId: competition.id,
            eventId: eventId,
            roundId: roundId,
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
      end
    end
  end

  users.each_with_index do |user, i|
    RanksAverage.create!(
      personId: user.wca_id,
      eventId: "333",
      best: "4242",
      worldRank: i,
      continentRank: i,
      countryRank: i,
    )

    RanksSingle.create!(
      personId: user.wca_id,
      eventId: "333",
      best: "2000",
      worldRank: i,
      continentRank: i,
      countryRank: i,
    )
  end

  day = 1000.years.from_now
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
    venue: "My backyard",
    website: "https://www.worldcubeassociation.org",
    showAtAll: true,
    delegates: [delegate],
    organizers: User.all.sample(2),
    use_wca_registration: true,
    registration_open: 1.week.ago,
    registration_close: day - (1.week),
  )

  users.each_with_index do |user, i|
    status = i % 4 == 0 ? "a" : "p"
    if i % 2 == 0
      Registration.new(
        competition: future_competition,
        name: Faker::Name.name,
        personId: user.wca_id,
        countryId: Faker::Address.country,
        gender: "m",
        birthYear: 1990,
        birthMonth: 6,
        birthDay: 4,
        email: Faker::Internet.email,
        guests: rand(10),
        comments: Faker::Lorem.paragraph,
        ip: "1.1.1.1",
        status: status,
        eventIds: eventIds.sample(i).join(" "),
      ).save!(validate: false)
    else
      FactoryGirl.create(:registration, user: user, competition: future_competition, status: status)
    end
  end
end
