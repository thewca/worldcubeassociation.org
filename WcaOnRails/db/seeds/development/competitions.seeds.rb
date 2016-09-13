# frozen_string_literal: true
after "development:users" do
  class << self
    def random_events
      official = Event.official
      official.sample(rand(1..official.count))
    end

    def random_wca_value
      rand(5000..100000)
    end
  end

  countries = Country.all

  delegate = User.find_by(delegate_status: "delegate")

  users = User.where.not(wca_id: nil).sample(93)

  # Create some past competitions with results
  2.times do |i|
    day = i.days.ago

    competition = Competition.new(
      id: "My#{i}ResultsComp#{day.year}",
      name: "My #{i} Comp With Results #{day.year}",
      cellName: "My #{i} Comp With Results #{day.year}",
      cityName: Faker::Address.city,
      countryId: countries.sample.id,
      information: "Information!",
      start_date: day.strftime("%F"),
      end_date: day.strftime("%F"),
      venue: Faker::Address.street_name,
      venueAddress: Faker::Address.street_address + ", " + Faker::Address.city + " " + Faker::Address.postcode,
      external_website: "https://www.worldcubeassociation.org",
      showAtAll: true,
      delegates: [delegate],
      organizers: User.all.sample(2),
      use_wca_registration: true,
      registration_open: 2.weeks.ago,
      registration_close: 1.week.ago,
      latitude_degrees: rand(-90.0..90.0),
      longitude_degrees: rand(-180.0..180.0),
    )
    events = random_events
    competition.events = events

    competition.save!

    events.each do |event|
      %w(1 2 f).each do |roundId|
        users.each_with_index do |competitor, i|
          person = competitor.person
          Result.create!(
            pos: i+1,
            personId: person.wca_id,
            personName: person.name,
            countryId: person.countryId,
            competitionId: competition.id,
            eventId: event.id,
            roundId: roundId,
            formatId: "a",
            value1: random_wca_value,
            value2: random_wca_value,
            value3: random_wca_value,
            value4: random_wca_value,
            value5: random_wca_value,
            best: random_wca_value,
            average: random_wca_value,
            regionalSingleRecord: i == 0 ? "WR" : "",
            regionalAverageRecord: i == 0 ? "WR" : "",
          )
        end
      end
    end

    competition.update!(results_posted_at: Time.now)
  end

  # Create a bunch of competitions just to fill up the competitions list

  # Past competitions
  500.times do |i|
    day = i.days.ago
    competition = Competition.new(
      id: "My#{i}Comp#{day.year}",
      name: "My #{i} Best Comp #{day.year}",
      cellName: "My #{i} Comp #{day.year}",
      cityName: Faker::Address.city,
      countryId: countries.sample.id,
      information: "Information!",
      start_date: day.strftime("%F"),
      end_date: day.strftime("%F"),
      venue: Faker::Address.street_name,
      venueAddress: Faker::Address.street_address + ", " + Faker::Address.city + " " + Faker::Address.postcode,
      external_website: "https://www.worldcubeassociation.org",
      showAtAll: true,
      delegates: [delegate],
      organizers: User.all.sample(2),
      use_wca_registration: true,
      registration_open: 2.weeks.ago,
      registration_close: 1.week.ago,
      latitude_degrees: rand(-90.0..90.0),
      longitude_degrees: rand(-180.0..180.0),
    )
    events = random_events
    competition.events = events

    competition.save!
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

  # Upcoming competitions
  500.times do |i|
    start_day = (i+1).days.from_now
    end_day = start_day + (0..5).to_a.sample.days
    end_day = start_day if start_day.year != end_day.year

    competition = Competition.new(
      id: "MyComp#{i+1}#{start_day.year}",
      name: "My #{i+1} Comp #{start_day.year}",
      cellName: "My #{i+1} Comp #{start_day.year}",
      cityName: Faker::Address.city,
      countryId: countries.sample.id,
      information: "Information!",
      start_date: start_day.strftime("%F"),
      end_date:  end_day.strftime("%F"),
      venue: Faker::Address.street_name,
      venueAddress: Faker::Address.street_address + ", " + Faker::Address.city + " " + Faker::Address.postcode,
      external_website: "https://www.worldcubeassociation.org",
      showAtAll: true,
      delegates: [delegate],
      organizers: User.all.sample(2),
      use_wca_registration: true,
      registration_open: 1.week.ago,
      registration_close: start_day - (1.week),
      latitude_degrees: rand(-90.0..90.0),
      longitude_degrees: rand(-180.0..180.0),
    )
    events = random_events
    competition.events = events

    competition.save!

    # Create registrations for some competitions taking place far in the future
    next if i < 480
    users.each_with_index do |user, i|
      accepted_at = i % 4 == 0 ? Time.now : nil
      registration_events = events.sample(rand(1..events.count))
      FactoryGirl.create(:registration, user: user, competition: competition, accepted_at: accepted_at, events: registration_events)
    end
  end
end
