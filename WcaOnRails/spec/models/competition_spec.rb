# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Competition do
  it "defines a valid competition" do
    competition = FactoryBot.build :competition, name: "Foo: Test - 2015"
    expect(competition).to be_valid
    expect(competition.id).to eq "FooTest2015"
    expect(competition.name).to eq "Foo: Test - 2015"
    expect(competition.cellName).to eq "Foo: Test - 2015"
  end

  it "rejects invalid names" do
    [
      "foo (Test) - 2015",
      "Poly^3 2016",
      "HOOAH! SMA 2015",
      "Campeonato de Cubos Mágicos de São Carlos/SP 2013",
      "Moldavian Nationals – Winter 2016",
      "PingSkills Cubing Classic, 2016",
    ].each do |name|
      expect(FactoryBot.build(:competition, name: name)).to be_invalid_with_errors(
        name: ["must end with a year and must contain only alphanumeric characters, dashes(-), ampersands(&), periods(.), colons(:), apostrophes('), and spaces( )"],
      )
    end
  end

  it "rejects invalid city names" do
    city = "San Diego"
    expect(FactoryBot.build(:competition, countryId: "USA", cityName: city)).to be_invalid_with_errors(
      cityName: ["is not of the form 'city, state'"],
    )

    city = "San Diego, California"
    expect(FactoryBot.build(:competition, countryId: "USA", cityName: city)).to be_valid
  end

  context "when there is an entry fee" do
    it "correctly identifies there is a fee when there is only a base fee" do
      competition = FactoryBot.build :competition, name: "Foo: Test - 2015", base_entry_fee_lowest_denomination: 10
      expect(competition.has_fees?).to be true
      expect(competition.has_base_entry_fee?).to eq competition.base_entry_fee
    end

    it "correctly identifies there is a fee when there is only event fees" do
      competition = FactoryBot.create :competition, name: "Foo: Test - 2015", base_entry_fee_lowest_denomination: 0
      competition.competition_events.first.update_attribute(:fee_lowest_denomination, 100)
      expect(competition.has_base_entry_fee?).to be nil
      expect(competition.has_fees?).to be true
    end
  end

  it "requires entry fees" do
    competition = FactoryBot.create :competition
    competition.confirmed = true

    # Required for non-multi venue competitions.
    competition.countryId = "USA"
    expect(competition.entry_fee_required?).to be true
    expect(competition.guests_entry_fee_required?).to be true

    # Not required for competitions in multiple countries
    competition.countryId = "XA"
    expect(competition.entry_fee_required?).to be false
    expect(competition.guests_entry_fee_required?).to be false

    # Not required for with no country
    competition.countryId = nil
    expect(competition.entry_fee_required?).to be false
    expect(competition.guests_entry_fee_required?).to be false
  end

  it "handles free guest entry status" do
    competition = FactoryBot.create :competition

    competition.guest_entry_status = Competition.guest_entry_statuses['free']
    expect(competition.all_guests_allowed?).to be true
    expect(competition.some_guests_allowed?).to be false

    competition.guest_entry_status = competition.guest_entry_status = Competition.guest_entry_statuses['restricted']
    expect(competition.all_guests_allowed?).to be false
    expect(competition.some_guests_allowed?).to be true
  end

  context "when competition has a competitor limit" do
    it "requires competitor limit to be a number" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true
      expect(competition).to be_invalid_with_errors(competitor_limit: ["is not a number"])
    end

    it "requires competitor limit to be greater than 0" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true, competitor_limit: 0, competitor_limit_reason: 'Because'
      expect(competition).to be_invalid_with_errors(competitor_limit: ["must be greater than or equal to 1"])
    end

    it "requires competitor limit to be less than 5001" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true, competitor_limit: 5001, competitor_limit_reason: 'Because'
      expect(competition).to be_invalid_with_errors(competitor_limit: ["must be less than or equal to 5000"])
    end

    it "requires a competitor limit reason" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true, competitor_limit: 100
      expect(competition).to be_invalid_with_errors(competitor_limit_reason: ["can't be blank"])
    end
  end

  context "when it is part of a Series" do
    let!(:series) { FactoryBot.create :competition_series }
    let!(:competition) { FactoryBot.create :competition, competition_series: series, latitude: 51_508_147, longitude: -75_848, starts: 1.week.ago }

    context "checks WCRP requirements" do
      it "cannot link two competitions that are more than 100km apart" do
        too_far_away_competition = FactoryBot.build :competition, competition_series: series, series_base: competition,
                                                                  series_distance_km: 16_990, distance_direction_deg: 330.56652339271716

        # also expect the competition to report the exact problem
        expect(too_far_away_competition).to be_invalid_with_errors(competition_series: [I18n.t('competitions.errors.series_distance_km', competition: competition.name)])
      end

      it "cannot link two competitions that are more than 33 days apart" do
        too_long_ago_competition = FactoryBot.build :competition, competition_series: series, series_base: competition, series_distance_days: 1095

        # also expect the competition to report the exact problem
        expect(too_long_ago_competition).to be_invalid_with_errors(competition_series: [I18n.t('competitions.errors.series_distance_days', competition: competition.name)])
      end

      it "cannot extend the WCRP limitations by transitive property" do
        # Say you're organising three competitions that have venues on the same, 200km-long straight line street.
        straight_line_series = FactoryBot.create :competition_series, wcif_id: "HaversineSeries2015", name: "Haversine Series 2015"

        # First, you create the comp at one end of the street. No linking yet, all good.
        one_end_competition = FactoryBot.create :competition, name: "One End Open 2015", competition_series: straight_line_series
        expect(one_end_competition).to be_valid

        # span a circle around the equator
        walking_direction_rad = (2 * Math::PI) + Math.atan2(-competition.latitude, -competition.longitude)
        walking_direction_deg = (walking_direction_rad * 180 / Math::PI) % 360

        just_barely_distance_km = CompetitionSeries::MAX_SERIES_DISTANCE_KM - 1

        # Second, you create the comp at the middle of the street. It is within 100km from the original competition so still all good.
        middle_competition = FactoryBot.create :competition, name: "Middle Open 2015", competition_series: straight_line_series,
                                                             series_base: one_end_competition, series_distance_km: just_barely_distance_km,
                                                             distance_direction_deg: walking_direction_deg
        expect(middle_competition).to be_valid

        # Last, you create the competition at the other end of the road. You _can_ link it to the middle one,
        # which is (just a tiny bit under) 100km away making it a perfect partner competition. But it is not acceptable
        # as partner competition for the first comp at the other end of the road, and our code should detect that.
        other_end_competition = FactoryBot.build :competition, name: "Other End Open 2015", competition_series: straight_line_series,
                                                               series_base: middle_competition, series_distance_km: just_barely_distance_km,
                                                               distance_direction_deg: walking_direction_deg

        expect(other_end_competition).to be_invalid_with_errors(competition_series: [I18n.t('competitions.errors.series_distance_km', competition: one_end_competition.name)])
      end
    end

    it "does not include itself as a sibling" do
      partner_competition = FactoryBot.create :competition, competition_series: series, series_base: competition

      expect(competition.series_sibling_competitions).to eq [partner_competition]
      expect(series.competitions.count).to eq 2
    end

    context "it can be linked with more than one competition" do
      let!(:same_place_different_day) { FactoryBot.create :competition, competition_series: series, series_base: competition, series_distance_days: 7 }
      let!(:same_day_different_place) { FactoryBot.create :competition, competition_series: series, series_base: competition, series_distance_km: 4.628, distance_direction_deg: 185.6446971397621 }

      it "can be linked with more than one competition" do
        expect(competition.series_sibling_competitions.count).to eq 2
        expect(series.competitions.count).to eq 3
      end

      it "lists all siblings ordered by start date" do
        expect(competition.series_sibling_competitions).to eq [same_day_different_place, same_place_different_day]
      end
    end
  end

  context "delegates" do
    it "delegates for future comps must be current delegates" do
      competition = FactoryBot.build :competition, :with_delegate, :future
      competition.delegates.first.update_columns(delegate_status: nil)

      expect(competition).to be_invalid_with_errors(staff_delegate_ids: ["are not all Delegates"],
                                                    trainee_delegate_ids: ["are not all Delegates"])
    end

    it "delegates for past comps no longer need to be delegates" do
      competition = FactoryBot.build :competition, :with_delegate, :past
      competition.delegates.first.update_columns(delegate_status: nil, senior_delegate_id: nil)

      expect(competition).to be_valid
    end
  end

  it "handles missing start/end_date" do
    competition = FactoryBot.build :competition, start_date: nil, end_date: nil
    competition2 = FactoryBot.build :competition, start_date: nil, end_date: nil
    expect(competition.is_probably_over?).to be false
    expect(competition.started?).to be false
    expect(competition.in_progress?).to be false
    expect(competition.has_date?).to be false
    expect(competition.dangerously_close_to?(competition2)).to be false
  end

  it "calculates the correct days until another future competition" do
    competition = FactoryBot.build :competition, start_date: Date.parse("2021-01-01"), end_date: Date.parse("2021-01-03")
    competition2 = FactoryBot.build :competition, start_date: Date.parse("2021-02-01"), end_date: Date.parse("2021-02-02")
    expect(competition.days_until_competition?(competition2)).to be 29
  end

  it "calculates the correct days until another past competition" do
    competition = FactoryBot.build :competition, start_date: Date.parse("2021-02-01"), end_date: Date.parse("2021-02-02")
    competition2 = FactoryBot.build :competition, start_date: Date.parse("2021-01-01"), end_date: Date.parse("2021-01-03")
    expect(competition.days_until_competition?(competition2)).to be(-29)
  end

  it "requires that registration_open be before registration_close" do
    competition = FactoryBot.build :competition, name: "Foo Test 2015", starts: 1.month.from_now, ends: 1.month.from_now, registration_open: 1.week.ago, registration_close: 2.weeks.ago, use_wca_registration: true
    expect(competition).to be_invalid_with_errors(registration_close: ["registration close must be after registration open"])
  end

  it "requires registration period if use_wca_registration" do
    competition = FactoryBot.build :competition, name: "Foo Test 2015", registration_open: nil, registration_close: nil, use_wca_registration: true
    expect(competition).to be_invalid_with_errors(registration_open: ["required"])
    expect(competition).to be_invalid_with_errors(registration_close: ["required"])
  end

  it "truncates name as necessary to produce id and cellName" do
    competition = FactoryBot.build :competition, name: "Alexander and the Terrible Horrible No Good 2015"
    expect(competition).to be_valid
    expect(competition.id).to eq "AlexanderandtheTerribleHorri2015"
    expect(competition.name).to eq "Alexander and the Terrible Horrible No Good 2015"
    expect(competition.cellName).to eq "Alexander and the Terrib... 2015"
  end

  it "saves without losing data" do
    competition = FactoryBot.create :competition
    json_data = competition.as_json
    competition.save
    expect(competition.as_json).to eq json_data
  end

  it "requires that name end in a year" do
    competition = FactoryBot.build :competition, name: "Name without year"
    expect(competition).to be_invalid_with_errors(
      name: ["must end with a year and must contain only alphanumeric characters, dashes(-), ampersands(&), periods(.), colons(:), apostrophes('), and spaces( )"],
    )
  end

  it "requires that cellName end in a year" do
    competition = FactoryBot.build :competition, cellName: "Name no year"
    expect(competition).to be_invalid_with_errors(cellName: ["must end with a year and must contain only alphanumeric characters, dashes(-), ampersands(&), periods(.), colons(:), apostrophes('), and spaces( )"])
  end

  describe "invalid date formats become nil" do
    let(:competition) { FactoryBot.create :competition }

    it "start_date" do
      competition.start_date = "i am not a date"
      expect(competition.start_date).to eq nil
    end

    it "end_date" do
      competition.end_date = "i am also not a date"
      expect(competition.end_date).to eq nil
    end
  end

  it "requires that both dates are empty or both are valid" do
    competition = FactoryBot.create :competition
    expect(competition).to be_valid

    competition.start_date = "1987-12-04"
    competition.end_date = ""
    expect(competition).to be_invalid_with_errors(end_date: ["invalid"])

    competition.end_date = "1987-12-05"
    expect(competition).to be_valid
  end

  it "requires that the start is before the end" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-12-06"
    competition.end_date = "1987-12-05"
    expect(competition).to be_invalid_with_errors(end_date: ["End date cannot be before start date."])
  end

  it "last less than MAX_SPAN_DAYS days" do
    competition = FactoryBot.create :competition
    competition.start_date = Date.today.strftime("%F")
    competition.end_date = (Date.today + Competition::MAX_SPAN_DAYS).strftime("%F")
    expect(competition).to be_invalid_with_errors(
      end_date: [I18n.t('competitions.errors.span_too_many_days', max_days: Competition::MAX_SPAN_DAYS)],
    )
  end

  it "requires the registration period to be before the competition" do
    competition = FactoryBot.build :competition, name: "Foo Test 2015", starts: 1.month.from_now, ends: 1.month.from_now, registration_open: 2.months.from_now, registration_close: 3.months.from_now, use_wca_registration: true
    expect(competition).to be_invalid_with_errors(
      registration_close: [I18n.t('competitions.errors.registration_period_after_start')],
    )
  end

  it "requires the waiting list deadline to be after the registration close" do
    competition = FactoryBot.build :competition,
                                   name: "Foo Test 2015",
                                   starts: 1.month.from_now,
                                   ends: 1.month.from_now,
                                   registration_open: 1.month.ago,
                                   registration_close: 1.week.from_now,
                                   use_wca_registration: true,
                                   waiting_list_deadline_date: 1.day.from_now
    expect(competition).to be_invalid_with_errors(
      waiting_list_deadline_date: [I18n.t('competitions.errors.waiting_list_deadline_before_registration_close')],
    )
  end

  it "requires the waiting list deadline to be after the refund deadline" do
    competition = FactoryBot.build :competition,
                                   name: "Foo Test 2015",
                                   starts: 1.month.from_now,
                                   ends: 1.month.from_now,
                                   registration_open: 1.month.ago,
                                   registration_close: 1.week.from_now,
                                   use_wca_registration: true,
                                   waiting_list_deadline_date: 2.weeks.from_now,
                                   refund_policy_limit_date: 3.weeks.from_now
    expect(competition).to be_invalid_with_errors(
      waiting_list_deadline_date: [I18n.t('competitions.errors.waiting_list_deadline_before_refund_date')],
    )
  end

  it "requires the waiting list deadline to be before the competition start" do
    competition = FactoryBot.build :competition,
                                   name: "Foo Test 2015",
                                   starts: 1.month.from_now,
                                   ends: 1.month.from_now,
                                   registration_open: 1.month.ago,
                                   registration_close: 1.week.from_now,
                                   use_wca_registration: true,
                                   waiting_list_deadline_date: 2.months.from_now
    expect(competition).to be_invalid_with_errors(
      waiting_list_deadline_date: [I18n.t('competitions.errors.waiting_list_deadline_after_start')],
    )
  end

  it "requires the event change deadline to be after the registration close" do
    competition = FactoryBot.build :competition,
                                   name: "Foo Test 2015",
                                   starts: 1.month.from_now,
                                   ends: 1.month.from_now,
                                   registration_open: 1.month.ago,
                                   registration_close: 1.week.from_now,
                                   use_wca_registration: true,
                                   event_change_deadline_date: 1.day.from_now
    expect(competition).to be_invalid_with_errors(
      event_change_deadline_date: [I18n.t('competitions.errors.event_change_deadline_before_registration_close')],
    )
  end

  it "requires the event change deadline to be before the competition ends" do
    competition = FactoryBot.build :competition,
                                   name: "Foo Test 2015",
                                   starts: 1.month.from_now,
                                   ends: 1.month.from_now,
                                   registration_open: 1.month.ago,
                                   registration_close: 1.week.from_now,
                                   use_wca_registration: true,
                                   event_change_deadline_date: 2.months.from_now
    expect(competition).to be_invalid_with_errors(
      event_change_deadline_date: [I18n.t('competitions.errors.event_change_deadline_after_end_date')],
    )
  end

  it "requires the event change deadline to be during the competition if OTS is required" do
    competition = FactoryBot.build :competition,
                                   name: "Foo Test 2015",
                                   starts: 1.month.from_now,
                                   ends: 1.month.from_now,
                                   registration_open: 1.month.ago,
                                   registration_close: 1.week.from_now,
                                   use_wca_registration: true,
                                   event_change_deadline_date: 2.weeks.from_now,
                                   on_the_spot_registration: true,
                                   on_the_spot_entry_fee_lowest_denomination: 0
    expect(competition).to be_invalid_with_errors(
      event_change_deadline_date: [I18n.t('competitions.errors.event_change_deadline_with_ots')],
    )
  end

  it "requires competition name is not greater than 50 characters" do
    competition = FactoryBot.build :competition, name: "A really long competition name that is greater than 50 characters 2016"
    expect(competition).to be_invalid_with_errors(
      name: ["is too long (maximum is 50 characters)"],
    )
  end

  context "#user_should_post_delegate_report?" do
    it "warns for unposted reports" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 2.days.ago
      delegate = competition.delegates.first
      expect(competition.user_should_post_delegate_report?(delegate)).to eq true
    end

    it "does not warn for posted reports" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 2.days.ago
      competition.delegate_report.update!(schedule_url: "http://example.com", posted: true)
      delegate = competition.delegates.first
      expect(competition.user_should_post_delegate_report?(delegate)).to eq false
    end

    it "does not warn for upcoming competitions" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 1.days.from_now
      delegate = competition.delegates.first
      expect(competition.user_should_post_delegate_report?(delegate)).to eq false
    end

    it "does not warn board members" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 2.days.ago
      board_member = FactoryBot.create :user, :board_member
      expect(competition.user_should_post_delegate_report?(board_member)).to eq false
    end
  end

  context "warnings_for" do
    let(:competition) { FactoryBot.create(:competition) }

    it "warns if competition name is greater than 32 characters and it's not publicly visible" do
      competition = FactoryBot.build :competition, name: "A really long competition name 2016", showAtAll: false
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:name]).to eq "The competition name is longer than 32 characters. We prefer shorter ones and we will be glad if you change it."
    end

    it "does not warn about name greater than 32 when competition is publicly visible" do
      competition = FactoryBot.build :competition, :confirmed, :visible, name: "A really long competition name 2016"
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:name]).to eq nil
    end

    it "warns if competition is not visible" do
      competition = FactoryBot.build :competition, showAtAll: false
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:invisible]).to eq "This competition is not visible to the public."
    end

    it "warns if competition has no events" do
      competition = FactoryBot.build :competition, events: []
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:events]).to eq "Please add at least one event before confirming the competition."
    end

    it "warns if competition is visible and hasn't been announced" do
      competition = FactoryBot.create :competition, :confirmed, :visible, announced_at: nil, announced_by: nil
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:announcement]).to eq "This competition is visible to the public but hasn't been announced yet."
    end

    it "warns if competition has results and haven't been posted" do
      competition = FactoryBot.create :competition, :confirmed, :visible, results_posted_at: nil, results_posted_by: nil
      FactoryBot.create(:result, person: FactoryBot.create(:person), competitionId: competition.id)

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:results]).to eq "This competition's results are visible but haven't been posted yet."
    end

    it "does not warn about other different championships" do
      # Different championship type
      FactoryBot.create :competition, :confirmed, :visible, starts: Date.new(2019, 5, 6), championship_types: ["_North America"]
      # Different year
      FactoryBot.create :competition, :confirmed, :visible, starts: Date.new(2018, 2, 3), championship_types: ["world"]

      competition = FactoryBot.create :competition, starts: Date.new(2019, 10, 1), championship_types: ["world"]
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)["world"]).to eq nil
    end

    it "warns if championship already exists" do
      FactoryBot.create :competition, :confirmed, :visible, starts: Date.new(2019, 5, 6), championship_types: ["world", "_Oceania"]

      competition = FactoryBot.create :competition, starts: Date.new(2019, 10, 1), championship_types: ["world"]
      expect(competition).to be_valid
      expect(competition.championship_warnings["world"]).to eq "There is already a World Championship in 2019."
    end

    it "warns if competition id starts with a lowercase" do
      competition = FactoryBot.build :competition, id: "lowercase2021"
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:id]).to eq I18n.t('competitions.messages.id_starts_with_lowercase')
    end

    it "do not warn if competition id starts with a number" do
      competition = FactoryBot.build :competition, id: "1stNumberedComp2021"
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:id]).to eq nil
    end

    it "warns if advancement condition isn't present for a non final round" do
      FactoryBot.create :round, competition: competition, event_id: "333", number: 1
      FactoryBot.create :round, competition: competition, event_id: "333", number: 2

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:advancement_conditions]).to eq I18n.t('competitions.messages.advancement_condition_must_be_present_for_all_non_final_rounds')
    end

    it "warns if the cutoff is greater than the time limit for any round" do
      round = FactoryBot.create :round, competition: competition, event_id: "333", time_limit: TimeLimit.new(centiseconds: 5.minutes.in_centiseconds), cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 6.minutes.in_centiseconds)

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)['cutoff_is_greater_than_time_limit' + round.id.to_s]).to eq I18n.t('competitions.messages.cutoff_is_greater_than_time_limit', round_number: 1, event: I18n.t('events.333'))
    end

    it "warns if the cutoff is very fast" do
      round = FactoryBot.create :round, competition: competition, event_id: "333", cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 4.seconds.in_centiseconds)

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)['cutoff_is_too_fast' + round.id.to_s]).to eq I18n.t('competitions.messages.cutoff_is_too_fast', round_number: 1, event: I18n.t('events.333'))
    end

    it "warns if the cutoff is very slow" do
      round = FactoryBot.create :round, competition: competition, event_id: "333", cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 11.minutes.in_centiseconds)

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)['cutoff_is_too_slow' + round.id.to_s]).to eq I18n.t('competitions.messages.cutoff_is_too_slow', round_number: 1, event: I18n.t('events.333'))
    end

    it "warns if the time limit is very fast" do
      round =FactoryBot.create :round, competition: competition, event_id: "333", time_limit: TimeLimit.new(centiseconds: 9.seconds.in_centiseconds)

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)['time_limit_is_too_fast' + round.id.to_s]).to eq I18n.t('competitions.messages.time_limit_is_too_fast', round_number: 1, event: I18n.t('events.333'))
    end

    it "warns if the time limit is very slow" do
      round =FactoryBot.create :round, competition: competition, event_id: "333", time_limit: TimeLimit.new(centiseconds: 11.minutes.in_centiseconds)

      expect(competition).to be_valid
      expect(competition.warnings_for(nil)['time_limit_is_too_slow' + round.id.to_s]).to eq I18n.t('competitions.messages.time_limit_is_too_slow', round_number: 1, event: I18n.t('events.333'))
    end
  end

  context "info_for" do
    it "displays info if competition is finished but results aren't posted" do
      competition = FactoryBot.build :competition, starts: 1.month.ago
      expect(competition).to be_valid
      expect(competition.is_probably_over?).to be true
      expect(competition.results_posted?).to be false
      expect(competition.info_for(nil)[:upload_results]).to eq "This competition is over, we are working to upload the results as soon as possible!"
    end

    it "displays info if competition is in progress" do
      competition = FactoryBot.build :competition, :ongoing
      expect(competition).to be_valid
      expect(competition.in_progress?).to be true
      expect(competition.info_for(nil)[:in_progress]).to eq "This competition is ongoing. Come back after #{I18n.l(competition.end_date, format: :long)} to see the results!"

      competition.use_wca_live_for_scoretaking = true
      expect(competition.info_for(nil)[:in_progress]).to eq "This competition is ongoing. You can check the live results <a href='https://live.worldcubeassociation.org/link/competitions/#{competition.id}'>here</a>!"

      competition.results_posted_at = Time.now
      competition.results_posted_by = FactoryBot.create(:user, :wrt_member).id
      expect(competition.in_progress?).to be false
      expect(competition.info_for(nil)[:in_progress]).to eq nil
    end
  end

  context "competition with results posted" do
    let!(:competition) { FactoryBot.create :competition, :ongoing, :results_posted }

    it "in_progress? is false" do
      expect(competition.in_progress?).to be false
    end

    it "over scope does include the competition" do
      expect(Competition.over.find_by_id(competition.id)).to eq competition
    end

    it "not_over scope does not include the competition" do
      expect(Competition.not_over.find_by_id(competition.id)).to eq nil
    end
  end

  it "knows the calendar" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-0-04"
    expect(competition.start_date).to eq nil
  end

  it "gracefully handles multiyear competitions" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-11-06"
    competition.end_date = "1988-12-07"
    competition.save
    expect(competition).to be_invalid_with_errors(end_date: ["Competition cannot last more than 6 days."])
    expect(competition.end_date).to eq Date.parse("1988-12-07")
  end

  it "converts microdegrees to degrees" do
    competition = FactoryBot.build :competition, latitude: 40, longitude: 30
    expect(competition.latitude_degrees).to eq 40/1e6
    expect(competition.longitude_degrees).to eq 30/1e6
  end

  it "converts degrees to microdegrees when saving" do
    competition = FactoryBot.create :competition
    competition.latitude_degrees = 3.5
    competition.longitude_degrees = 4.6
    competition.save!
    expect(competition.latitude).to eq 3.5*1e6
    expect(competition.longitude).to eq 4.6*1e6
  end

  it "ensures all attributes are defined as either cloneable or uncloneable" do
    expect(Competition.column_names).to match_array(Competition::CLONEABLE_ATTRIBUTES + Competition::UNCLONEABLE_ATTRIBUTES)
  end

  describe "validates internal website" do
    it "likes http://foo.com" do
      competition = FactoryBot.build :competition, external_website: "http://foo.com"
      expect(competition).to be_valid
    end

    it "dislikes [{foo}{http://foo.com}]" do
      competition = FactoryBot.build :competition, external_website: "[{foo}{http://foo.com}]"
      expect(competition).not_to be_valid
    end

    it "dislikes htt://foo" do
      competition = FactoryBot.build :competition, external_website: "htt://foo"
      expect(competition).not_to be_valid
    end

    it "doesn't valitate if the inernal website is used" do
      competition = FactoryBot.build :competition, external_website: "", generate_website: true
      expect(competition).to be_valid
    end
  end

  it "saves staff_delegate_ids" do
    delegate1 = FactoryBot.create(:delegate, name: "Daniel", email: "daniel@d.com")
    delegate2 = FactoryBot.create(:delegate, name: "Chris", email: "chris@c.com")
    delegates = [delegate1, delegate2]
    staff_delegate_ids = delegates.map(&:id).join(",")
    competition = FactoryBot.create :competition, staff_delegate_ids: staff_delegate_ids
    expect(competition.delegates.sort_by(&:name)).to eq delegates.sort_by(&:name)
  end

  it "saves organizer_ids" do
    organizer1 = FactoryBot.create(:user, name: "Bob", email: "bob@b.com")
    organizer2 = FactoryBot.create(:user, name: "Jane", email: "jane@j.com")
    organizers = [organizer1, organizer2]
    organizer_ids = organizers.map(&:id).join(",")
    competition = FactoryBot.create :competition, organizer_ids: organizer_ids
    expect(competition.organizers.sort_by(&:name)).to eq organizers.sort_by(&:name)
  end

  describe "adding/removing events" do
    let(:two_by_two) { Event.find "222" }
    let(:three_by_three) { Event.find "333" }
    let(:competition) { FactoryBot.create(:competition, use_wca_registration: true, events: [two_by_two, three_by_three]) }

    it "removes registrations when event is removed" do
      r = FactoryBot.create(:registration, competition: competition, competition_events: competition.competition_events)

      expect(RegistrationCompetitionEvent.count).to eq 2
      competition.competition_events.joins(:event).find_by(event: two_by_two).destroy!
      expect(RegistrationCompetitionEvent.count).to eq 1

      r.reload
      expect(r.events).to match_array [three_by_three]
    end
  end

  describe "when changing the id of a competition" do
    let(:competition) { FactoryBot.create(:competition, :with_delegate, :with_organizer, use_wca_registration: true) }

    it "changes the competition_id of registrations" do
      reg1 = FactoryBot.create(:registration, competition_id: competition.id)
      competition.update_attribute(:id, "NewID2015")
      expect(reg1.reload.competition_id).to eq "NewID2015"
    end

    it "changes the competitionId of results" do
      r1 = FactoryBot.create(:result, competitionId: competition.id)
      r2 = FactoryBot.create(:result, competitionId: competition.id)
      competition.update_attribute(:id, "NewID2015")
      expect(r1.reload.competitionId).to eq "NewID2015"
      expect(r2.reload.competitionId).to eq "NewID2015"
    end

    it "changes the competitionId of scrambles" do
      scramble1 = FactoryBot.create(:scramble, competitionId: competition.id)
      competition.update_attribute(:id, "NewID2015")
      expect(scramble1.reload.competitionId).to eq "NewID2015"
    end

    it "can set competition_events_attributes" do
      comp_events = competition.competition_events

      # Force ActiveRecord to do database queries for the associated competition_events
      # with the new competition id.
      competition.reload

      old_events = competition.events
      competition.update!(
        id: "MyerComp2016",
        competition_events_attributes: [
          { "id"=> comp_events[0].id, "event_id"=>comp_events[0].event_id, "_destroy"=>"0" },
          { "id"=> comp_events[1].id, "event_id"=>comp_events[1].event_id, "_destroy"=>"0" },
        ],
      )
      new_events = competition.events
      expect(new_events).to eq old_events
    end

    it "updates the competition_id of competition_delegates and competition_organizers" do
      organizer = competition.organizers.first
      delegate = competition.delegates.first

      expect(CompetitionDelegate.where(delegate_id: delegate.id).count).to eq 1
      expect(CompetitionOrganizer.where(organizer_id: organizer.id).count).to eq 1

      cd = CompetitionDelegate.find_by_delegate_id(delegate.id)
      expect(cd).not_to eq nil
      co = CompetitionOrganizer.find_by_organizer_id(organizer.id)
      expect(co).not_to eq nil

      c = Competition.find(competition.id)
      c.id = "NewID2015"
      c.save!

      expect(CompetitionDelegate.where(delegate_id: delegate.id).count).to eq 1
      expect(CompetitionOrganizer.where(organizer_id: organizer.id).count).to eq 1
      expect(CompetitionDelegate.find(cd.id).competition_id).to eq "NewID2015"
      expect(CompetitionOrganizer.find(co.id).competition_id).to eq "NewID2015"
    end
  end

  describe "when deleting a competition" do
    it "deletes delegates" do
      delegate1 = FactoryBot.create(:delegate)
      delegates = [delegate1]
      competition = FactoryBot.create :competition, delegates: delegates

      cd = CompetitionDelegate.where(competition_id: competition.id, delegate_id: delegate1.id).first
      expect(cd).not_to be_nil
      competition.destroy
      expect(CompetitionDelegate.find_by_id(cd.id)).to be_nil
    end

    it "deletes organizers" do
      organizer1 = FactoryBot.create(:delegate)
      organizers = [organizer1]
      competition = FactoryBot.create :competition, organizers: organizers

      cd = CompetitionOrganizer.where(competition_id: competition.id, organizer_id: organizer1.id).first
      expect(cd).not_to be_nil
      competition.destroy
      expect(CompetitionOrganizer.find_by_id(cd.id)).to be_nil
    end

    it "deletes registrations" do
      registration = FactoryBot.create(:registration)
      registration.competition.destroy
      expect(Registration.find_by_id(registration.id)).to be_nil
    end
  end

  describe "when confirming or making visible" do
    let(:competition_with_delegate) { FactoryBot.build :competition, :with_delegate, generate_website: false }
    let(:competition_without_delegate) { FactoryBot.build :competition }

    [:confirmed, :showAtAll].each do |action|
      it "can set #{action}" do
        competition_with_delegate.public_send "#{action}=", true
        expect(competition_with_delegate).to be_valid
      end

      [:cityName, :countryId, :venue, :venueAddress, :external_website, :latitude, :longitude].each do |field|
        it "requires #{field} when setting #{action}" do
          competition_with_delegate.assign_attributes field => "", action => true
          expect(competition_with_delegate).not_to be_valid
        end
      end

      it "must have at least one event when setting #{action}" do
        competition_with_delegate.assign_attributes events: [], action => true
        expect(competition_with_delegate).not_to be_valid
      end

      it "requires both dates when setting #{action}" do
        competition_with_delegate.assign_attributes start_date: "", end_date: "", action => true
        expect(competition_with_delegate).not_to be_valid
      end

      it "requires at least one delegate when setting #{action}" do
        competition_without_delegate.public_send "#{action}=", true
        expect(competition_without_delegate).not_to be_valid
      end
    end

    it "sets confirmed_at when setting confirmed true" do
      competition = FactoryBot.create :competition, :with_delegate, :with_valid_schedule
      expect(competition.confirmed_at).to be_nil

      now = Time.at(Time.now.to_i)
      Timecop.freeze(now) do
        competition.update!(confirmed: true)
        expect(competition.reload.confirmed_at).to eq now
      end
    end

    it "does not update confirmed_at when confirming already confirmed competition" do
      competition = FactoryBot.create :competition, :confirmed

      confirmed_at = competition.confirmed_at
      expect(confirmed_at).not_to be_nil
      Timecop.freeze(confirmed_at + 10) do
        competition.update!(confirmed: true)
        expect(competition.reload.confirmed_at).to eq confirmed_at
      end
    end

    it "clears confirmed_at when setting confirmed false" do
      competition = FactoryBot.create :competition, :confirmed

      expect(competition.confirmed_at).not_to be_nil
      competition.update!(confirmed: false)
      expect(competition.reload.confirmed_at).to be_nil
    end
  end

  describe "receive_registration_emails" do
    let(:competition) { FactoryBot.create :competition }
    let(:delegate) { FactoryBot.create :delegate }
    let(:delegate_enabled) { FactoryBot.create :delegate, registration_notifications_enabled: true }

    it "computes receiving_registration_emails? via OR" do
      expect(competition.receiving_registration_emails?(delegate.id)).to eq false

      competition.delegates << delegate
      expect(competition.receiving_registration_emails?(delegate.id)).to eq false

      competition.delegates << delegate_enabled
      expect(competition.receiving_registration_emails?(delegate_enabled.id)).to eq true

      cd = competition.competition_delegates.find_by_delegate_id(delegate.id)
      cd.update_column(:receive_registration_emails, true)
      expect(competition.receiving_registration_emails?(delegate.id)).to eq true

      competition.organizers << delegate
      expect(competition.receiving_registration_emails?(delegate.id)).to eq true

      co = competition.competition_organizers.find_by_organizer_id(delegate.id)
      co.update_column(:receive_registration_emails, true)
      expect(competition.receiving_registration_emails?(delegate.id)).to eq true
    end

    it "setting receive_registration_emails" do
      competition.delegates << delegate
      cd = competition.competition_delegates.find_by_delegate_id(delegate.id)
      expect(cd.receive_registration_emails).to eq false

      competition.receive_registration_emails = false
      competition.editing_user_id = delegate.id
      competition.save!
      competition.receive_registration_emails = nil
      expect(cd.reload.receive_registration_emails).to eq false

      competition.organizers << delegate
      co = competition.competition_organizers.find_by_organizer_id(delegate.id)
      expect(co.receive_registration_emails).to eq false

      competition.receive_registration_emails = false
      competition.editing_user_id = delegate.id
      competition.save!

      expect(cd.reload.receive_registration_emails).to eq false
      expect(co.reload.receive_registration_emails).to eq false

      # Test we can change the setting for a delegate with notifications
      # enabled by default.
      competition.delegates << delegate_enabled
      cde = competition.competition_delegates.find_by_delegate_id(delegate_enabled.id)
      expect(cde.receive_registration_emails).to eq true
      competition.receive_registration_emails = false
      competition.editing_user_id = delegate_enabled.id
      competition.save!
      expect(cde.reload.receive_registration_emails).to eq false
    end
  end

  describe "results" do
    let(:three_by_three) { Event.find "333" }
    let(:two_by_two) { Event.find "222" }
    let!(:competition) {
      c = FactoryBot.create :competition, events: [three_by_three, two_by_two]
      # Create the results rounds right now so that we can use them later.
      FactoryBot.create :round, competition: c, total_number_of_rounds: 2, number: 1, event_id: "333"
      FactoryBot.create :round, competition: c, total_number_of_rounds: 2, number: 2, event_id: "333"
      FactoryBot.create :round, competition: c, total_number_of_rounds: 1, number: 1, event_id: "222", cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 60*100)
      c
    }

    let(:person_one) { FactoryBot.create :person, name: "One" }
    let(:person_two) { FactoryBot.create :person, name: "Two" }
    let(:person_three) { FactoryBot.create :person, name: "Three" }
    let(:person_four) { FactoryBot.create :person, name: "Four" }

    let!(:r_333_1_first) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 1, person: person_one }
    let!(:r_333_1_second) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 2, person: person_two }
    let!(:r_333_1_third) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 3, person: person_three }
    let!(:r_333_1_fourth) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 4, person: person_four }

    let!(:r_333_f_first) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "f", pos: 1, person: person_one }
    let!(:r_333_f_second) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "f", pos: 2, person: person_two }
    let!(:r_333_f_third) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "f", pos: 3, person: person_three }

    let!(:r_222_c_second_tied) { FactoryBot.create :result, competition: competition, eventId: "222", roundTypeId: "c", pos: 1, person: person_two }
    let!(:r_222_c_first_tied) { FactoryBot.create :result, competition: competition, eventId: "222", roundTypeId: "c", pos: 1, person: person_one }

    it "events_with_podium_results" do
      result = competition.events_with_podium_results
      expect(result.size).to eq 2
      expect(result.first.first).to eq three_by_three
      expect(result.first.last.map(&:value1)).to eq [3000] * 3

      expect(result.last.first).to eq two_by_two
      expect(result.last.last.map(&:value1)).to eq [3000, 3000]
    end

    it "winning_results" do
      result = competition.winning_results
      expect(result.size).to eq 3
      expect(result.first.eventId).to eq "333"
      expect(result.first.best).to eq 3000
      expect(result.first.roundTypeId).to eq "f"

      expect(result.last.eventId).to eq "222"
      expect(result.last.best).to eq 3000
      expect(result.last.roundTypeId).to eq "c"
    end

    it "person_ids_with_results" do
      result = competition.person_ids_with_results
      expect(result.size).to eq 4
      expect(result.map(&:first)).to eq [person_four, person_one, person_three, person_two].map(&:wca_id)
      expect(result.second.last.map(&:roundTypeId)).to eq %w(f 1 c)

      expect(result[1][1][1].muted).to eq true
      expect(result[1][1][2].muted).to eq false

      expect(result[2][1][1].muted).to eq true
      expect(result[3][1][1].muted).to eq true
    end

    it "events_with_round_types_with_results" do
      results = competition.events_with_round_types_with_results
      expect(results.size).to eq 2
      expect(results[0].first).to eq three_by_three
      expect(results[0].second.first.first).to eq RoundType.find("f")
      expect(results[0].second.first.last.map(&:value1)).to eq [3000] * 3
      expect(results[0].second.first.last.map(&:eventId)).to eq ["333"] * 3
      expect(results[0].second.second.last.map(&:value1)).to eq [3000] * 4

      expect(results[1].first).to eq two_by_two
      expect(results[1].second.first.first).to eq RoundType.find("c")
      expect(results[1].second.first.last.map(&:value1)).to eq [3000, 3000]

      # Orders results which tied by person name.
      expect(results[1].second.first.last.map(&:personName)).to eq %w(One Two)
    end

    it "winning_results and events_with_podium_results don't include results with DNF as best" do
      competition.results.where(eventId: "222").update_all(best: SolveTime::DNF_VALUE)
      expect(competition.winning_results.map(&:event).uniq).to eq [three_by_three]
      expect(competition.events_with_podium_results.map(&:first).uniq).to eq [three_by_three]
    end
  end

  it "when id is changed, foreign keys are updated as well" do
    competition = FactoryBot.create(:competition, :with_delegate, :with_organizer, :with_delegate_report, :registration_open)
    FactoryBot.create(:result, competitionId: competition.id)
    FactoryBot.create(:competition_tab, competition: competition)
    FactoryBot.create(:registration, competition: competition)

    expect do
      competition.update_attribute(:id, "NewName2016")
    end.to_not change {
      [:results, :organizers, :delegates, :tabs, :registrations, :delegate_report].map do |associated|
        competition.send(associated)
      end
    }

    expect(competition).to respond_to(:update_foreign_keys),
                           "This whole test should be removed alongside update_foreign_keys callback in the Competition model."
  end

  context "when cloned competition is saved" do
    let!(:competition) { FactoryBot.create(:competition) }
    let!(:clone) do
      competition.build_clone.tap do |clone|
        clone.name = "Cloned Competition 2016"
        clone.start_date, clone.end_date = [1.month.from_now.strftime("%F")] * 2
      end
    end
    let!(:tab) { FactoryBot.create(:competition_tab, competition: competition) }

    it "tabs are cloned" do
      expect do
        clone.save
      end.to change(CompetitionTab, :count).by(1)
      cloned_tab = clone.reload.tabs.first
      expect(cloned_tab).to_not eq tab
      expect(cloned_tab.name).to eq tab.name
      expect(cloned_tab.content).to eq tab.content
    end

    it "tabs are not cloned if clone_tabs is set to false" do
      clone.clone_tabs = false
      clone.save
      expect(clone.tabs).to be_empty
    end
  end

  context "website" do
    let!(:competition) { FactoryBot.build(:competition, id: "Competition2016", external_website: "https://external.website.com") }

    it "returns the internal url if WCA website is used as competition's one" do
      competition.generate_website = true
      expect(competition.website).to end_with "Competition2016"
    end

    it "returns external url if WCA website is not used as competitin's one" do
      expect(competition.website).to eq "https://external.website.com"
    end
  end

  context "competitors" do
    let!(:competition) { FactoryBot.create(:competition) }

    it "works" do
      FactoryBot.create_list :result, 2, competition: competition
      expect(competition.competitors.count).to eq 2
    end

    it "handles competitors with multiple subIds" do
      person_with_sub_ids = FactoryBot.create :person_with_multiple_sub_ids
      FactoryBot.create :result, competition: competition, person: person_with_sub_ids
      FactoryBot.create :result, competition: competition
      expect(competition.competitors.count).to eq 2
    end
  end

  describe "#contains" do
    let!(:delegate) { FactoryBot.create :delegate, name: 'Pedro' }
    let!(:search_comp) { FactoryBot.create :competition, name: "Awesome Comp 2016", cityName: "Piracicaba, São Paulo", countryId: "Brazil", delegates: [delegate] }
    it "searching with two words" do
      expect(Competition.contains('eso').contains('aci').first).to eq search_comp
      expect(Competition.contains('awesome').contains('comp').first).to eq search_comp
      expect(Competition.contains('abc').contains('def').first).to eq nil
      expect(Competition.contains('ped').contains('aci').first).to eq nil
      expect(Competition.contains('wes').contains('blah').first).to eq nil
    end
  end

  describe "#managed_by" do
    let(:delegate1) { FactoryBot.create(:delegate) }
    let(:delegate2) { FactoryBot.create(:delegate) }
    let(:organizer1) { FactoryBot.create(:user) }
    let(:organizer2) { FactoryBot.create(:user) }
    let!(:competition) {
      FactoryBot.create(:competition, :confirmed, delegates: [delegate1, delegate2], organizers: [organizer1, organizer2])
    }
    let!(:competition_without_organizers) {
      FactoryBot.create(:competition, :confirmed, delegates: [delegate1, delegate2], organizers: [])
    }
    let!(:other_comp) { FactoryBot.create(:competition) }

    it "finds comps by delegate" do
      expect(Competition.managed_by(delegate1.id)).to match_array [competition, competition_without_organizers]
    end

    it "finds comps by organizer" do
      expect(Competition.managed_by(organizer1.id)).to match_array [competition]
    end
  end

  describe "#serializable_hash" do
    let(:competition) { FactoryBot.create :competition, countryId: "USA" }

    it "sets iso2 to nil when country is missing" do
      expect(competition).to be_valid

      competition.countryId = ""
      expect(competition).to be_invalid_with_errors(country: ["must exist"])

      expect(competition.serializable_hash[:country_iso2]).to be_nil
    end
  end

  describe "#registration_full?" do
    let(:competition) {
      FactoryBot.create :competition,
                        :registration_open,
                        competitor_limit_enabled: true,
                        competitor_limit: 10,
                        competitor_limit_reason: "Dude, this is my closet"
    }

    it "detects full competition" do
      expect(competition.registration_full?).to be false

      # Add 9 accepted registrations. The list should not yet be full.
      FactoryBot.create_list :registration, 9, :accepted, competition: competition
      expect(competition.registration_full?).to be false

      # Add a 10th registration, which will fill up the registration list.
      new_registration = FactoryBot.create :registration, :accepted, competition: competition
      expect(competition.registration_full?).to be true

      # Delete the 10th accepted registration. Now the list should not be full.
      new_registration.destroy
      expect(competition.registration_full?).to be false

      # Add an unpaid pending registration. The list should not yet be full.
      FactoryBot.create :registration, :pending, competition: competition
      expect(competition.registration_full?).to be false

      # Add a paid pending registration. The list should be full.
      FactoryBot.create :registration, :paid_pending, competition: competition
      expect(competition.registration_full?).to be true
    end
  end

  describe '#registration_full_message' do
    let(:competition) {
      FactoryBot.create :competition,
                        :registration_open,
                        competitor_limit_enabled: true,
                        competitor_limit: 10,
                        competitor_limit_reason: "Dude, this is my closet"
    }

    it "detects full competition warning message" do
      # Add 9 accepted registrations
      FactoryBot.create_list :registration, 9, :accepted, competition: competition

      # Add a 10th accepted registration
      new_registration = FactoryBot.create :registration, :accepted, competition: competition
      expect(competition.registration_full_message).to eq(
        I18n.t('registrations.registration_full', competitor_limit: competition.competitor_limit),
      )

      # Delete the 10th accepted registration
      new_registration.destroy

      # Add a paid pending registration
      FactoryBot.create :registration, :paid_pending, competition: competition
      expect(competition.registration_full_message).to eq(
        I18n.t('registrations.registration_full_include_waiting_list', competitor_limit: competition.competitor_limit),
      )
    end
  end

  context "when changing the competition's date" do
    let(:competition) {
      FactoryBot.create :competition,
                        with_schedule: true,
                        start_date: Date.parse("2018-10-24"),
                        end_date: Date.parse("2018-10-26")
    }
    let(:all_activities) {
      competition.all_activities
    }

    def change_and_check_activities(new_start_date, new_end_date)
      on_first_day, on_last_day = all_activities.partition { |a| a.start_time.to_date == competition.start_date }
      # the factory define one activity per day, the two lines below are
      # basically safe guards against a future change to the competition's factory.
      expect(on_first_day).not_to be_empty
      expect(on_last_day).not_to be_empty
      competition.update(start_date: new_start_date,
                         end_date: new_end_date)
      all_activities.map(&:reload)
      # Check activities moved
      expect(on_first_day.map { |a| [a.start_time.to_date, a.end_time.to_date] }.flatten.uniq).to eq([new_start_date])
      expect(on_last_day.map { |a| [a.start_time.to_date, a.end_time.to_date] }.flatten.uniq).to eq([new_end_date])
    end

    it "shrinks schedule" do
      # Move the competition and shrink it by one day
      # The expected behavior is:
      #   - activities on the old start date go to new start date
      #   - others go to the new end date
      change_and_check_activities(Date.parse("2018-09-18"), Date.parse("2018-09-19"))
    end

    it "moves schedule" do
      # Keep the same number of days, just move it around
      change_and_check_activities(Date.parse("2018-11-18"), Date.parse("2018-11-20"))
    end
  end

  describe "has_defined_dates" do
    it "is false when no start and end date" do
      competition = FactoryBot.create(:competition, start_date: nil, end_date: nil)
      expect(competition.has_defined_dates?).to eq false
    end

    it "is true when has start and end date" do
      competition = FactoryBot.create(:competition)
      expect(competition.has_defined_dates?).to eq true
    end
  end

  it "cannot add organizers with missing data" do
    organizer = FactoryBot.create :user, country_iso2: nil
    competition = FactoryBot.build :competition, organizers: [organizer]
    expect(competition).not_to be_valid
    expect(competition.errors.messages[:organizer_ids].first).to match "Need a region"
  end

  describe "is exempt from dues" do
    let(:four_by_four) { Event.find "444" }
    let(:fmc) { Event.find "333fm" }

    it "is false when competition has no championships" do
      competition = FactoryBot.create(:competition, events: [four_by_four], championship_types: [], countryId: "Canada", cityName: "Vancouver, British Columbia")
      expect(competition.exempt_from_wca_dues?).to eq false
    end

    it "is false when competition is a national championship" do
      competition = FactoryBot.create(:competition, events: Event.official, championship_types: ["CA"], countryId: "Canada", cityName: "Vancouver, British Columbia")
      expect(competition.exempt_from_wca_dues?).to eq false
    end

    it "is false when 333fm is the only event and competition is in a single country" do
      competition = FactoryBot.create(:competition, events: [fmc], championship_types: [], countryId: "Canada", cityName: "Vancouver, British Columbia")
      expect(competition.exempt_from_wca_dues?).to eq false
    end

    it "is true when 333fm is the only event and competition is in multiple countries" do
      competition = FactoryBot.create(:competition, events: [fmc], championship_types: [], countryId: "XN")
      expect(competition.exempt_from_wca_dues?).to eq true
    end

    it "is true when 333fm is the only event and competition is in multiple continents" do
      competition = FactoryBot.create(:competition, events: [fmc], championship_types: [], countryId: "XW")
      expect(competition.exempt_from_wca_dues?).to eq true
    end

    it "is true when competition is a national championship and a world championship" do
      competition = FactoryBot.create(:competition, events: Event.official, championship_types: ["AU", "world"], countryId: "Australia", cityName: "Melbourne, Victoria")
      expect(competition.exempt_from_wca_dues?).to eq true
    end

    it "is true when competition is a continental championship" do
      competition = FactoryBot.create(:competition, events: Event.official, championship_types: ["_North America"], countryId: "Canada", cityName: "Vancouver, British Columbia")
      expect(competition.exempt_from_wca_dues?).to eq true
    end

    it "is true when competition is a world championship" do
      competition = FactoryBot.create(:competition, events: Event.official, championship_types: ["world"], countryId: "Korea")
      expect(competition.exempt_from_wca_dues?).to eq true
    end
  end

  context "does not have guest limit" do
    let(:competition) { FactoryBot.create :competition, guest_entry_status: Competition.guest_entry_statuses['free'] }

    it "accepts a competition that asks about guests, but does not have guest limit enabled" do
      competition.guests_enabled = true
      expect(competition).to be_valid
    end

    it "accepts a competition that does not ask about guests and does not have guest limit enabled" do
      competition.guests_enabled = false
      expect(competition).to be_valid
    end

    it "accepts a competition that does not have guest limit enabled, but has a guest limit" do
      # hypothetically, this field can be set, but the limit would not be enforced if it is not enabled.
      competition.guests_per_registration_limit = 10
      expect(competition).to be_valid
    end
  end

  context "has guest limit" do
    let(:competition) { FactoryBot.create :competition, :with_guest_limit }

    it "accepts a competition that asks about guests and has a valid guest limit enabled" do
      expect(competition).to be_valid
    end

    it "requires also asking about guests" do
      competition.guests_enabled = false
      expect(competition).to be_invalid_with_errors(guests_enabled: ["Must ask about guests if a guest limit is specified."])
    end

    it "requires guest limit to be a number" do
      competition = FactoryBot.build :competition, :with_guest_limit
      competition.guests_per_registration_limit = "string"
      expect(competition).to be_invalid_with_errors(guests_per_registration_limit: ["is not a number"])
    end

    it "requires guest limit to be an integer" do
      competition = FactoryBot.build :competition, :with_guest_limit
      competition.guests_per_registration_limit = 1.5
      expect(competition).to be_invalid_with_errors(guests_per_registration_limit: ["must be an integer"])
    end

    it "requires guest limit to be greater than or equal to 1" do
      competition = FactoryBot.build :competition, :with_guest_limit
      competition.guests_per_registration_limit = -1
      expect(competition).to be_invalid_with_errors(guests_per_registration_limit: ["must be greater than or equal to 1"])
    end

    it "requires guest limit to be less than or equal to 100" do
      competition = FactoryBot.build :competition, :with_guest_limit
      competition.guests_per_registration_limit = 101
      expect(competition).to be_invalid_with_errors(guests_per_registration_limit: ["must be less than or equal to 100"])
    end
  end

  context "event restrictions and limits" do
    event_ids = ["222", "333", "444", "555"]
    number_of_events = event_ids.length
    let(:competition) { FactoryBot.build :competition, :with_event_limit, event_ids: event_ids }

    context "a competition that has event restrictions, reason for the restrictions, and a valid event limit" do
      it "accepts an event limit of one" do
        competition.events_per_registration_limit = 1
        expect(competition).to be_valid
      end

      it "accepts an event limit less than to number of events" do
        competition.events_per_registration_limit = number_of_events - 1
        expect(competition).to be_valid
      end

      it "accepts an event limit equal to number of events" do
        competition.events_per_registration_limit = number_of_events
        expect(competition).to be_valid
      end
    end

    context "a competition that has event restrictions, reason for the restrictions, but invalid event limit" do
      it "rejects a negative event limit" do
        competition.events_per_registration_limit = -1
        expect(competition).to be_invalid_with_errors(events_per_registration_limit: ["must be greater than or equal to 1"])
      end

      it "rejects an event limit of zero" do
        competition.events_per_registration_limit = 0
        expect(competition).to be_invalid_with_errors(events_per_registration_limit: ["must be greater than or equal to 1"])
      end

      it "rejects an event limit greater than number of events" do
        competition.events_per_registration_limit = number_of_events + 1
        expect(competition).to be_invalid_with_errors(events_per_registration_limit: ["must be less than or equal to #{number_of_events}"])
      end

      it "rejects a non-numeric event limit" do
        competition.events_per_registration_limit = "five"
        expect(competition).to be_invalid_with_errors(events_per_registration_limit: ["is not a number"])
      end

      it "rejects a non-integer event limit" do
        competition.events_per_registration_limit = 2.5
        expect(competition).to be_invalid_with_errors(events_per_registration_limit: ["must be an integer"])
      end
    end

    it "accepts a competition that has event restrictions and reason for the restrictions, but no event limit" do
      competition.event_restrictions = true
      competition.event_restrictions_reason = "reason"
      competition.events_per_registration_limit = nil
      expect(competition).to be_valid
    end

    it "rejects a competition that has event restrictions, but no reason for the restrictions" do
      competition.event_restrictions = true
      competition.event_restrictions_reason = nil
      competition.events_per_registration_limit = nil
      expect(competition).to be_invalid_with_errors(event_restrictions_reason: ["can't be blank"])
    end

    it "accepts a competition that does not have any event restrictions" do
      competition.event_restrictions = false
      competition.event_restrictions_reason = nil
      competition.events_per_registration_limit = nil
      expect(competition).to be_valid
    end

    it "accepts a competition that does not have event restrictions, but has an event limit" do
      # Hypothetically, this field can be set, but the limit would not be
      # enforced nor validated since event restrictions are not enabled.
      competition.event_restrictions = false
      competition.event_restrictions_reason = nil
      competition.events_per_registration_limit = 100
      expect(competition).to be_valid
    end
  end

  context "has valid schedule" do
    let(:competition) { FactoryBot.create :competition, :with_valid_schedule }

    it "ics export includes all rounds" do
      competition.rounds.map(&:name).each do |r|
        expect(competition.to_ics.events.map { |e| e.summary.to_s }).to include(r)
      end
    end
  end
end
