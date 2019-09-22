# frozen_string_literal: true

after "development:users" do
  class << self
    def random_events
      official = Event.official
      official.sample(rand(1..official.count))
    end

    def random_wca_value
      r = rand(5000..100_000)

      # Solves over 10 minutes must be rounded to the nearest second.
      if r > 10 * 60 * 100
        r = 100 * (r / 100)
      end
      r
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
      cityName: "Paris, France",
      countryId: "France",
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
    competition.events = random_events

    competition.save!

    competition.events.each do |event|
      %w(1 2 f).each do |roundTypeId|
        users.each_with_index do |competitor, j|
          person = competitor.person
          result = Result.new(
            pos: j+1,
            personId: person.wca_id,
            personName: person.name,
            countryId: person.countryId,
            competitionId: competition.id,
            eventId: event.id,
            roundTypeId: roundTypeId,
            formatId: "a",
            value1: random_wca_value,
            value2: random_wca_value,
            value3: random_wca_value,
            value4: random_wca_value,
            value5: random_wca_value,
            regionalSingleRecord: j == 0 ? "WR" : "",
            regionalAverageRecord: j == 0 ? "WR" : "",
          )
          result.average = result.compute_correct_average
          result.best = result.compute_correct_best
          result.save!
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
      cityName: "San Francisco, California",
      countryId: "USA",
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
    competition.events = random_events

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
      cityName: "Shenzhen, Guangdong",
      countryId: "China",
      information: "Information!",
      start_date: start_day.strftime("%F"),
      end_date: end_day.strftime("%F"),
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
    competition.events = random_events

    competition.save!

    # Create registrations for some competitions taking place far in the future
    next if i < 480
    users.each_with_index do |user, j|
      accepted_at = j % 4 == 0 ? Time.now : nil
      registration_competition_events = competition.competition_events.sample(rand(1..competition.competition_events.count))
      FactoryBot.create(:registration, user: user, competition: competition, accepted_at: accepted_at, competition_events: registration_competition_events)
    end
  end
end
