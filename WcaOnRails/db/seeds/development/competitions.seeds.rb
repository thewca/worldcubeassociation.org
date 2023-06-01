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

    def random_city(country)
      city = Faker::Address.city
      state_validator = CityValidator.get_validator_for_country(country.iso2)
      if state_validator
        city += ", #{state_validator.valid_regions.to_a.sample}"
      end
      city
    end
  end

  countries = Country.all

  delegate = User.find_by(delegate_status: "delegate")

  users = User.where.not(wca_id: nil).sample(93)

  # Create some past competitions with results
  2.times do |i|
    day = i.days.ago
    country = countries.sample

    competition = Competition.new(
      id: "My#{i}ResultsComp#{day.year}",
      name: "My #{i} Comp With Results #{day.year}",
      cell_name: "My #{i} Comp With Results #{day.year}",
      city_name: random_city(country),
      country_id: country.id,
      information: "Information!",
      start_date: day.strftime("%F"),
      end_date: day.strftime("%F"),
      venue: Faker::Address.street_name,
      venue_address: Faker::Address.street_address + ", " + Faker::Address.city + " " + Faker::Address.postcode,
      external_website: "https://www.worldcubeassociation.org",
      show_at_all: true,
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

    competition.competition_events.each do |competition_event|
      event = competition_event.event
      round_types = %w(1 2 f).freeze

      round_types.each_with_index do |round_type_id, j|
        round_format = event.preferred_formats.first.format
        is_final = j == round_types.length - 1

        Round.create!(
          competition_event: competition_event,
          format: round_format,
          number: j+1,
          total_number_of_rounds: round_types.length,
          time_limit: event.can_change_time_limit? ? TimeLimit.new : nil,
          cutoff: nil,
          advancement_condition: is_final ? nil : AdvancementConditions::RankingCondition.new(16),
          scramble_set_count: rand(1..4),
          round_results: [],
        )
        users.each_with_index do |competitor, k|
          person = competitor.person
          result = Result.new(
            pos: k+1,
            person_id: person.wca_id,
            person_name: person.name,
            country_id: person.country_id,
            competition_id: competition.id,
            event_id: event.id,
            round_type_id: round_type_id,
            format_id: round_format.id,
            regional_single_record: k == 0 ? "WR" : nil,
            regional_average_record: k == 0 ? "WR" : nil,
          )
          round_format.expected_solve_count.times do |v|
            result.send("value#{v+1}=", random_wca_value)
          end
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
    country = countries.sample

    competition = Competition.new(
      id: "My#{i}Comp#{day.year}",
      name: "My #{i} Best Comp #{day.year}",
      cell_name: "My #{i} Comp #{day.year}",
      city_name: random_city(country),
      country_id: country.id,
      information: "Information!",
      start_date: day.strftime("%F"),
      end_date: day.strftime("%F"),
      venue: Faker::Address.street_name,
      venue_address: Faker::Address.street_address + ", " + Faker::Address.city + " " + Faker::Address.postcode,
      external_website: "https://www.worldcubeassociation.org",
      show_at_all: true,
      delegates: [delegate],
      organizers: User.all.sample(2),
      use_wca_registration: true,
      registration_open: 2.weeks.before(day),
      registration_close: 1.week.before(day),
      latitude_degrees: rand(-90.0..90.0),
      longitude_degrees: rand(-180.0..180.0),
    )
    competition.events = random_events

    competition.save!
  end

  users.each_with_index do |user, i|
    RanksAverage.create!(
      person_id: user.wca_id,
      event_id: "333",
      best: "4242",
      world_rank: i,
      continent_rank: i,
      country_rank: i,
    )

    RanksSingle.create!(
      person_id: user.wca_id,
      event_id: "333",
      best: "2000",
      world_rank: i,
      continent_rank: i,
      country_rank: i,
    )
  end

  # Upcoming competitions
  500.times do |i|
    start_day = (i+1).days.from_now
    end_day = start_day + (0..5).to_a.sample.days
    end_day = start_day if start_day.year != end_day.year
    country = countries.sample

    competition = Competition.new(
      id: "MyComp#{i+1}#{start_day.year}",
      name: "My #{i+1} Comp #{start_day.year}",
      cell_name: "My #{i+1} Comp #{start_day.year}",
      city_name: random_city(country),
      country_id: country.id,
      information: "Information!",
      start_date: start_day.strftime("%F"),
      end_date: end_day.strftime("%F"),
      venue: Faker::Address.street_name,
      venue_address: Faker::Address.street_address + ", " + Faker::Address.city + " " + Faker::Address.postcode,
      external_website: "https://www.worldcubeassociation.org",
      show_at_all: true,
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
