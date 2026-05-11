# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Competition WCIF" do
  let!(:competition) do
    create(
      :competition,
      :visible,
      :with_competitor_limit,
      :with_valid_schedule,
      id: "TestComp2014",
      name: "Test Comp 2014",
      cell_name: "Test 2014",
      start_date: "2014-02-03",
      end_date: "2014-02-05",
      external_website: "http://example.com",
      event_ids: [],
      competition_events: [event_333, event_222, event_444, event_333fm, event_333mbf],
      exclude_from_schedule: %w[222],
      schedule_only_one_venue: true,
      competitor_limit: 50,
      registration_open: "2013-12-01",
      registration_close: "2013-12-31",
    )
  end
  let!(:partner_competition) do
    create(
      :competition,
      :visible,
      id: "PartnerComp2014",
      series_base: competition,
      series_distance_days: 3,
    )
  end
  let!(:competition_series) do
    create(
      :competition_series,
      wcif_id: "SpectacularSeries2014",
      name: "The Spectacular Series 2014",
      short_name: "Spectacular 2014",
      competitions: [competition, partner_competition],
    )
  end
  let(:delegate) { competition.delegates.first }
  let(:organizer) { competition.organizers.first }
  let(:sixty_second_2_attempt_cutoff) { Cutoff.new(number_of_attempts: 2, attempt_result: 1.minute.in_centiseconds) }
  let(:top_16_average_condition) { ResultConditions::Ranking.new(value: 16, scope: 'average') }
  let(:top_16_advance) { AdvancementConditions::RankingCondition.new(16) }
  let(:round333_1) { build(:round, number: 1, cutoff: sixty_second_2_attempt_cutoff, advancement_condition: top_16_advance, scramble_set_count: 16, total_number_of_rounds: 2) }
  let(:round333_2) { build(:round, number: 2, total_number_of_rounds: 2, participation_source: round333_1, participation_condition: top_16_average_condition) }
  let(:event_333) { build(:competition_event, event_id: "333", rounds: [round333_1, round333_2]) }
  let(:round444_1) { build(:round, number: 1) }
  let(:event_444) { build(:competition_event, event_id: "444", rounds: [round444_1]) }
  let(:round222_1) { build(:round, number: 1) }
  let(:event_222) { build(:competition_event, event_id: "222", rounds: [round222_1]) }
  let(:round333fm_1) { build(:round, number: 1, format_id: "m") }
  let(:event_333fm) { build(:competition_event, event_id: "333fm", rounds: [round333fm_1]) }
  let(:round333mbf_1_extension) { WcifExtension.new(extension_id: "com.third.party", spec_url: "https://example.com", data: { "tables" => 5 }) }
  let(:round333mbf_1) { build(:round, number: 1, format_id: "3", wcif_extensions: [round333mbf_1_extension]) }
  let(:event_333mbf) { build(:competition_event, event_id: "333mbf", rounds: [round333mbf_1]) }

  describe "#to_wcif" do
    it "renders a valid WCIF" do
      expect(competition.to_wcif).to eq(
        "formatVersion" => "1.1",
        "id" => "TestComp2014",
        "name" => "Test Comp 2014",
        "shortName" => "Test 2014",
        "series" => {
          "id" => "SpectacularSeries2014",
          "name" => "The Spectacular Series 2014",
          "shortName" => "Spectacular 2014",
          "competitionIds" => %w[TestComp2014 PartnerComp2014],
        },
        "persons" => [organizer.to_wcif(competition), delegate.to_wcif(competition)],
        "events" => [
          {
            "id" => "333",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "333-r1",
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => {
                  "numberOfAttempts" => 2,
                  "attemptResult" => 1.minute.in_centiseconds,
                },
                "advancementCondition" => {
                  "type" => "ranking",
                  "level" => 16,
                },
                "scrambleSetCount" => 16,
                "results" => [],
                "extensions" => [],
              },
              {
                "id" => "333-r2",
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "advancementCondition" => nil,
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "222",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "222-r1",
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "advancementCondition" => nil,
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "444",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "444-r1",
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "advancementCondition" => nil,
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "333fm",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "333fm-r1",
                "format" => "m",
                "timeLimit" => nil,
                "cutoff" => nil,
                "advancementCondition" => nil,
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "333mbf",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "333mbf-r1",
                "format" => "3",
                "timeLimit" => nil,
                "cutoff" => nil,
                "advancementCondition" => nil,
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [
                  {
                    "id" => "com.third.party",
                    "specUrl" => "https://example.com",
                    "data" => {
                      "tables" => 5,
                    },
                  },
                ],
              },
            ],
            "qualification" => nil,
          },
        ],
        "schedule" => {
          "startDate" => "2014-02-03",
          "numberOfDays" => 3,
          "venues" => [
            {
              "id" => 1,
              "name" => "Venue 1",
              "latitudeMicrodegrees" => 123_456,
              "longitudeMicrodegrees" => 123_456,
              "countryIso2" => "US",
              "timezone" => "Europe/Paris",
              "extensions" => [],
              "rooms" => [
                {
                  "id" => 1,
                  "name" => "Room 1 for venue 1",
                  "color" => VenueRoom::DEFAULT_ROOM_COLOR,
                  "extensions" => [],
                  "activities" => [
                    {
                      "id" => 1,
                      "name" => "Great round",
                      "activityCode" => "333-r1",
                      "startTime" => "2014-02-03T10:00:00Z",
                      "endTime" => "2014-02-03T14:00:00Z",
                      "childActivities" => [
                        {
                          "id" => 2,
                          "name" => "Great round, group 1",
                          "activityCode" => "333-r1-g1",
                          "startTime" => "2014-02-03T10:00:00Z",
                          "endTime" => "2014-02-03T10:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 3,
                          "name" => "Great round, group 2",
                          "activityCode" => "333-r1-g2",
                          "startTime" => "2014-02-03T10:15:00Z",
                          "endTime" => "2014-02-03T10:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 4,
                          "name" => "Great round, group 3",
                          "activityCode" => "333-r1-g3",
                          "startTime" => "2014-02-03T10:30:00Z",
                          "endTime" => "2014-02-03T10:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 5,
                          "name" => "Great round, group 4",
                          "activityCode" => "333-r1-g4",
                          "startTime" => "2014-02-03T10:45:00Z",
                          "endTime" => "2014-02-03T11:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 6,
                          "name" => "Great round, group 5",
                          "activityCode" => "333-r1-g5",
                          "startTime" => "2014-02-03T11:00:00Z",
                          "endTime" => "2014-02-03T11:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 7,
                          "name" => "Great round, group 6",
                          "activityCode" => "333-r1-g6",
                          "startTime" => "2014-02-03T11:15:00Z",
                          "endTime" => "2014-02-03T11:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 8,
                          "name" => "Great round, group 7",
                          "activityCode" => "333-r1-g7",
                          "startTime" => "2014-02-03T11:30:00Z",
                          "endTime" => "2014-02-03T11:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 9,
                          "name" => "Great round, group 8",
                          "activityCode" => "333-r1-g8",
                          "startTime" => "2014-02-03T11:45:00Z",
                          "endTime" => "2014-02-03T12:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 10,
                          "name" => "Great round, group 9",
                          "activityCode" => "333-r1-g9",
                          "startTime" => "2014-02-03T12:00:00Z",
                          "endTime" => "2014-02-03T12:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 11,
                          "name" => "Great round, group 10",
                          "activityCode" => "333-r1-g10",
                          "startTime" => "2014-02-03T12:15:00Z",
                          "endTime" => "2014-02-03T12:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 12,
                          "name" => "Great round, group 11",
                          "activityCode" => "333-r1-g11",
                          "startTime" => "2014-02-03T12:30:00Z",
                          "endTime" => "2014-02-03T12:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 13,
                          "name" => "Great round, group 12",
                          "activityCode" => "333-r1-g12",
                          "startTime" => "2014-02-03T12:45:00Z",
                          "endTime" => "2014-02-03T13:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 14,
                          "name" => "Great round, group 13",
                          "activityCode" => "333-r1-g13",
                          "startTime" => "2014-02-03T13:00:00Z",
                          "endTime" => "2014-02-03T13:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 15,
                          "name" => "Great round, group 14",
                          "activityCode" => "333-r1-g14",
                          "startTime" => "2014-02-03T13:15:00Z",
                          "endTime" => "2014-02-03T13:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 16,
                          "name" => "Great round, group 15",
                          "activityCode" => "333-r1-g15",
                          "startTime" => "2014-02-03T13:30:00Z",
                          "endTime" => "2014-02-03T13:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 17,
                          "name" => "Great round, group 16",
                          "activityCode" => "333-r1-g16",
                          "startTime" => "2014-02-03T13:45:00Z",
                          "endTime" => "2014-02-03T14:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                      ],
                      "extensions" => [],
                    },
                    {
                      "id" => 18,
                      "name" => "Enjoy your meal!",
                      "activityCode" => "other-lunch",
                      "startTime" => "2014-02-03T12:00:00Z",
                      "endTime" => "2014-02-03T13:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 19,
                      "name" => "Great round",
                      "activityCode" => "333-r2",
                      "startTime" => "2014-02-03T14:00:00Z",
                      "endTime" => "2014-02-03T18:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 20,
                      "name" => "Great round",
                      "activityCode" => "444-r1",
                      "startTime" => "2014-02-04T10:00:00Z",
                      "endTime" => "2014-02-04T14:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 21,
                      "name" => "Enjoy your meal!",
                      "activityCode" => "other-lunch",
                      "startTime" => "2014-02-04T12:00:00Z",
                      "endTime" => "2014-02-04T13:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 22,
                      "name" => "Great round",
                      "activityCode" => "333fm-r1",
                      "startTime" => "2014-02-04T14:00:00Z",
                      "endTime" => "2014-02-04T18:00:00Z",
                      "extensions" => [],
                      "childActivities" => [],
                    },
                    {
                      "id" => 23,
                      "name" => "Great round",
                      "activityCode" => "333mbf-r1",
                      "startTime" => "2014-02-05T10:00:00Z",
                      "endTime" => "2014-02-05T14:00:00Z",
                      "extensions" => [],
                      "childActivities" => [],
                    },
                  ],
                },
              ],
            },
            {
              "id" => 2,
              "name" => "Venue 2",
              "latitudeMicrodegrees" => 123_456,
              "longitudeMicrodegrees" => 123_456,
              "countryIso2" => "US",
              "timezone" => "Europe/Paris",
              "extensions" => [],
              "rooms" => [
                {
                  "id" => 2,
                  "name" => "Room 1 for venue 2",
                  "color" => VenueRoom::DEFAULT_ROOM_COLOR,
                  "activities" => [],
                  "extensions" => [],
                },
                {
                  "id" => 3,
                  "name" => "Room 2 for venue 2",
                  "color" => VenueRoom::DEFAULT_ROOM_COLOR,
                  "activities" => [],
                  "extensions" => [],
                },
              ],
            },
          ],
        },
        "competitorLimit" => 50,
        "extensions" => [],
        "registrationInfo" => {
          "openTime" => "2013-12-01T00:00:00Z",
          "closeTime" => "2013-12-31T00:00:00Z",
          "baseEntryFee" => 1000,
          "currencyCode" => "USD",
          "onTheSpotRegistration" => false,
          "useWcaRegistration" => false,
        },
      )
    end

    it "renders a valid v2 WCIF" do
      expect(competition.to_wcif(version: "2.0.0")).to eq(
        "formatVersion" => "2.0.0",
        "id" => "TestComp2014",
        "name" => "Test Comp 2014",
        "shortName" => "Test 2014",
        "series" => {
          "id" => "SpectacularSeries2014",
          "name" => "The Spectacular Series 2014",
          "shortName" => "Spectacular 2014",
          "competitionIds" => %w[TestComp2014 PartnerComp2014],
        },
        "persons" => [organizer.to_wcif(competition, version: "2.0.0"), delegate.to_wcif(competition, version: "2.0.0")],
        "events" => [
          {
            "id" => "333",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "333-r1",
                "linkedRounds" => nil,
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => {
                  "numberOfAttempts" => 2,
                  "attemptResult" => 1.minute.in_centiseconds,
                },
                "participationRuleset" => {
                  "participationSource" => {
                    "type" => "registrations",
                  },
                  "reservedPlaces" => nil,
                },
                "scrambleSetCount" => 16,
                "results" => [],
                "extensions" => [],
              },
              {
                "id" => "333-r2",
                "linkedRounds" => nil,
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "participationRuleset" => {
                  "participationSource" => {
                    "type" => "round",
                    "roundId" => "333-r1",
                    "resultCondition" => {
                      "type" => "ranking",
                      "scope" => "average",
                      "value" => 16,
                    },
                  },
                  "reservedPlaces" => nil,
                },
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "222",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "222-r1",
                "linkedRounds" => nil,
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "participationRuleset" => {
                  "participationSource" => {
                    "type" => "registrations",
                  },
                  "reservedPlaces" => nil,
                },
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "444",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "444-r1",
                "linkedRounds" => nil,
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "participationRuleset" => {
                  "participationSource" => {
                    "type" => "registrations",
                  },
                  "reservedPlaces" => nil,
                },
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "333fm",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "333fm-r1",
                "linkedRounds" => nil,
                "format" => "m",
                "timeLimit" => nil,
                "cutoff" => nil,
                "participationRuleset" => {
                  "participationSource" => {
                    "type" => "registrations",
                  },
                  "reservedPlaces" => nil,
                },
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [],
              },
            ],
            "qualification" => nil,
          },
          {
            "id" => "333mbf",
            "extensions" => [],
            "rounds" => [
              {
                "id" => "333mbf-r1",
                "linkedRounds" => nil,
                "format" => "3",
                "timeLimit" => nil,
                "cutoff" => nil,
                "participationRuleset" => {
                  "participationSource" => {
                    "type" => "registrations",
                  },
                  "reservedPlaces" => nil,
                },
                "scrambleSetCount" => 1,
                "results" => [],
                "extensions" => [
                  {
                    "id" => "com.third.party",
                    "specUrl" => "https://example.com",
                    "data" => {
                      "tables" => 5,
                    },
                  },
                ],
              },
            ],
            "qualification" => nil,
          },
        ],
        "schedule" => {
          "startDate" => "2014-02-03",
          "numberOfDays" => 3,
          "venues" => [
            {
              "id" => 1,
              "name" => "Venue 1",
              "latitudeMicrodegrees" => 123_456,
              "longitudeMicrodegrees" => 123_456,
              "countryIso2" => "US",
              "timezone" => "Europe/Paris",
              "extensions" => [],
              "rooms" => [
                {
                  "id" => 1,
                  "name" => "Room 1 for venue 1",
                  "color" => VenueRoom::DEFAULT_ROOM_COLOR,
                  "extensions" => [],
                  "activities" => [
                    {
                      "id" => 1,
                      "name" => "Great round",
                      "activityCode" => "333-r1",
                      "startTime" => "2014-02-03T10:00:00Z",
                      "endTime" => "2014-02-03T14:00:00Z",
                      "childActivities" => [
                        {
                          "id" => 2,
                          "name" => "Great round, group 1",
                          "activityCode" => "333-r1-g1",
                          "startTime" => "2014-02-03T10:00:00Z",
                          "endTime" => "2014-02-03T10:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 3,
                          "name" => "Great round, group 2",
                          "activityCode" => "333-r1-g2",
                          "startTime" => "2014-02-03T10:15:00Z",
                          "endTime" => "2014-02-03T10:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 4,
                          "name" => "Great round, group 3",
                          "activityCode" => "333-r1-g3",
                          "startTime" => "2014-02-03T10:30:00Z",
                          "endTime" => "2014-02-03T10:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 5,
                          "name" => "Great round, group 4",
                          "activityCode" => "333-r1-g4",
                          "startTime" => "2014-02-03T10:45:00Z",
                          "endTime" => "2014-02-03T11:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 6,
                          "name" => "Great round, group 5",
                          "activityCode" => "333-r1-g5",
                          "startTime" => "2014-02-03T11:00:00Z",
                          "endTime" => "2014-02-03T11:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 7,
                          "name" => "Great round, group 6",
                          "activityCode" => "333-r1-g6",
                          "startTime" => "2014-02-03T11:15:00Z",
                          "endTime" => "2014-02-03T11:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 8,
                          "name" => "Great round, group 7",
                          "activityCode" => "333-r1-g7",
                          "startTime" => "2014-02-03T11:30:00Z",
                          "endTime" => "2014-02-03T11:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 9,
                          "name" => "Great round, group 8",
                          "activityCode" => "333-r1-g8",
                          "startTime" => "2014-02-03T11:45:00Z",
                          "endTime" => "2014-02-03T12:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 10,
                          "name" => "Great round, group 9",
                          "activityCode" => "333-r1-g9",
                          "startTime" => "2014-02-03T12:00:00Z",
                          "endTime" => "2014-02-03T12:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 11,
                          "name" => "Great round, group 10",
                          "activityCode" => "333-r1-g10",
                          "startTime" => "2014-02-03T12:15:00Z",
                          "endTime" => "2014-02-03T12:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 12,
                          "name" => "Great round, group 11",
                          "activityCode" => "333-r1-g11",
                          "startTime" => "2014-02-03T12:30:00Z",
                          "endTime" => "2014-02-03T12:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 13,
                          "name" => "Great round, group 12",
                          "activityCode" => "333-r1-g12",
                          "startTime" => "2014-02-03T12:45:00Z",
                          "endTime" => "2014-02-03T13:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 14,
                          "name" => "Great round, group 13",
                          "activityCode" => "333-r1-g13",
                          "startTime" => "2014-02-03T13:00:00Z",
                          "endTime" => "2014-02-03T13:15:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 15,
                          "name" => "Great round, group 14",
                          "activityCode" => "333-r1-g14",
                          "startTime" => "2014-02-03T13:15:00Z",
                          "endTime" => "2014-02-03T13:30:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 16,
                          "name" => "Great round, group 15",
                          "activityCode" => "333-r1-g15",
                          "startTime" => "2014-02-03T13:30:00Z",
                          "endTime" => "2014-02-03T13:45:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                        {
                          "id" => 17,
                          "name" => "Great round, group 16",
                          "activityCode" => "333-r1-g16",
                          "startTime" => "2014-02-03T13:45:00Z",
                          "endTime" => "2014-02-03T14:00:00Z",
                          "childActivities" => [],
                          "extensions" => [],
                        },
                      ],
                      "extensions" => [],
                    },
                    {
                      "id" => 18,
                      "name" => "Enjoy your meal!",
                      "activityCode" => "other-lunch",
                      "startTime" => "2014-02-03T12:00:00Z",
                      "endTime" => "2014-02-03T13:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 19,
                      "name" => "Great round",
                      "activityCode" => "333-r2",
                      "startTime" => "2014-02-03T14:00:00Z",
                      "endTime" => "2014-02-03T18:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 20,
                      "name" => "Great round",
                      "activityCode" => "444-r1",
                      "startTime" => "2014-02-04T10:00:00Z",
                      "endTime" => "2014-02-04T14:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 21,
                      "name" => "Enjoy your meal!",
                      "activityCode" => "other-lunch",
                      "startTime" => "2014-02-04T12:00:00Z",
                      "endTime" => "2014-02-04T13:00:00Z",
                      "childActivities" => [],
                      "extensions" => [],
                    },
                    {
                      "id" => 22,
                      "name" => "Great round",
                      "activityCode" => "333fm-r1",
                      "startTime" => "2014-02-04T14:00:00Z",
                      "endTime" => "2014-02-04T18:00:00Z",
                      "extensions" => [],
                      "childActivities" => [],
                    },
                    {
                      "id" => 23,
                      "name" => "Great round",
                      "activityCode" => "333mbf-r1",
                      "startTime" => "2014-02-05T10:00:00Z",
                      "endTime" => "2014-02-05T14:00:00Z",
                      "extensions" => [],
                      "childActivities" => [],
                    },
                  ],
                },
              ],
            },
            {
              "id" => 2,
              "name" => "Venue 2",
              "latitudeMicrodegrees" => 123_456,
              "longitudeMicrodegrees" => 123_456,
              "countryIso2" => "US",
              "timezone" => "Europe/Paris",
              "extensions" => [],
              "rooms" => [
                {
                  "id" => 2,
                  "name" => "Room 1 for venue 2",
                  "color" => VenueRoom::DEFAULT_ROOM_COLOR,
                  "activities" => [],
                  "extensions" => [],
                },
                {
                  "id" => 3,
                  "name" => "Room 2 for venue 2",
                  "color" => VenueRoom::DEFAULT_ROOM_COLOR,
                  "activities" => [],
                  "extensions" => [],
                },
              ],
            },
          ],
        },
        "competitorLimit" => 50,
        "extensions" => [],
        "registrationInfo" => {
          "openTime" => "2013-12-01T00:00:00Z",
          "closeTime" => "2013-12-31T00:00:00Z",
          "baseEntryFee" => 1000,
          "currencyCode" => "USD",
          "onTheSpotRegistration" => false,
          "useWcaRegistration" => false,
        },
      )
    end

    context "schema validation" do
      it "passes on default stable version" do
        expect do
          Competition.validate_wcif_schema!(competition.to_wcif)
        end.not_to raise_error
      end

      it "passes on V2" do
        expect do
          Competition.validate_wcif_schema!(
            competition.to_wcif(version: '2.0.0'),
            version: '2.0.0',
          )
        end.not_to raise_error
      end

      it "does not pass on cross-version schema" do
        expect do
          Competition.validate_wcif_schema!(
            competition.to_wcif(version: '1.0.0'),
            version: '2.0.0',
          )
        end.to raise_error(JSON::Schema::ValidationError)

        expect do
          Competition.validate_wcif_schema!(
            competition.to_wcif(version: "2.0.0"),
            version: '1.0.0',
          )
        end.to raise_error(JSON::Schema::ValidationError)
      end
    end
  end

  describe "#set_wcif_competitor_limit!" do
    let(:competitor_limit_wcif) { competition.to_wcif["competitorLimit"] }

    it "Can set a new competitor limit" do
      competitor_limit_wcif = 120

      competition.set_wcif_competitor_limit!(competitor_limit_wcif, delegate)

      expect(competition.competitor_limit_enabled?).to be(true)
      expect(competition.to_wcif["competitorLimit"]).to eq(competitor_limit_wcif)
    end

    it "Cannot set a new competitor limit after a competition is confirmed" do
      competitor_limit_wcif = 120

      # Manually confirm the competition
      competition.confirmed_at = "2013-06-01"
      competition.save!

      expect { competition.set_wcif_competitor_limit!(competitor_limit_wcif, delegate) }.to raise_error(WcaExceptions::BadApiParameter)
    end

    it "Cannot add a competitor limit when competitor limits are not enabled" do
      competitor_limit_wcif = 120

      # Disable competitor limits for this competition manually.
      competition.competitor_limit_enabled = false
      competition.competitor_limit = nil
      competition.competitor_limit_reason = nil
      competition.save!

      # Adding a competitor limit should error
      expect { competition.set_wcif_competitor_limit!(competitor_limit_wcif, delegate) }.to raise_error(WcaExceptions::BadApiParameter)
    end

    it "Cannot remove a competitor limit" do
      competitor_limit_wcif = nil

      # Adding a competitor limit should error
      expect { competition.set_wcif_competitor_limit!(competitor_limit_wcif, delegate) }.to raise_error(WcaExceptions::BadApiParameter)
    end

    it "does not error when the limit is unchanged" do
      competitor_limit_wcif = 50

      # Manually confirm the competition
      competition.confirmed_at = "2013-06-01"
      competition.save!

      competition.set_wcif_competitor_limit!(competitor_limit_wcif, delegate)
      expect(competition.to_wcif["competitorLimit"]).to eq(competitor_limit_wcif)
    end
  end

  describe "#set_wcif_events!" do
    let(:wcif_version) { Competition::WCIF_STABLE_VERSION }
    let(:wcif) { competition.to_wcif(version: wcif_version) }

    it "does not remove competition event when wcif rounds are empty" do
      wcif_444_event = wcif["events"].find { |e| e["id"] == "444" }
      wcif_444_event["rounds"] = []

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
      expect(competition.event_ids).to match_array %w[222 333 333fm 333mbf 444]
    end

    it "does remove competition event when wcif rounds are nil" do
      wcif_444_event = wcif["events"].find { |e| e["id"] == "444" }
      wcif_444_event["rounds"] = nil

      competition.set_wcif_events!(wcif["events"], delegate)

      wcif["events"].reject! { |e| e["id"] == "444" }
      expect(competition.to_wcif["events"]).to eq(wcif["events"])
      expect(competition.event_ids).to match_array %w[222 333 333fm 333mbf]
    end

    it "removes competition event when wcif event is missing" do
      wcif["events"].reject! { |e| e["id"] == "444" }

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
      expect(competition.event_ids).to match_array %w[222 333 333fm 333mbf]
    end

    it "creates competition event when adding round to previously nonexistent event" do
      wcif555 = {
        "id" => "555",
        "extensions" => [],
        "rounds" => [
          {
            "id" => "555-r1",
            "format" => "a",
            "timeLimit" => {
              "centiseconds" => 3 * 60 * 100,
              "cumulativeRoundIds" => [],
            },
            "cutoff" => nil,
            "advancementCondition" => nil,
            "scrambleSetCount" => 1,
            "results" => [],
            "extensions" => [],
          },
        ],
        "qualification" => nil,
      }
      # Add 5x5x5 after 4x4x4 to match the expected order.
      wcif["events"].insert(3, wcif555)

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "creates new round when adding round to existing event" do
      wcif_444_event = wcif["events"].find { |e| e["id"] == "444" }
      wcif_444_event["rounds"][0]["advancementCondition"] = {
        "type" => "ranking",
        "level" => 16,
      }
      wcif_444_event["rounds"] << {
        "id" => "444-r2",
        "format" => "a",
        "timeLimit" => {
          "centiseconds" => 10.minutes.in_centiseconds,
          "cumulativeRoundIds" => [],
        },
        "cutoff" => nil,
        "advancementCondition" => nil,
        "scrambleSetCount" => 1,
        "results" => [],
        "extensions" => [],
      }

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])

      # Checking whether the backporting worked as expected
      competition_444_event = competition.competition_events.find { it.event_id == '444' }
      first_round, second_round = competition_444_event.rounds

      expect(first_round.participation_source).to eq(competition_444_event)
      expect(first_round.participation_condition).to be_nil

      expect(second_round.participation_source).to eq(first_round)
      expect(second_round.participation_condition).not_to be_nil

      # Verify that we can remove the round we just added, so long as we
      # clear the advancementCondition on the first round.
      wcif_444_event["rounds"][0]["advancementCondition"] = nil
      wcif_444_event["rounds"].pop
      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "can change round format to 'a'" do
      wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }
      wcif_333_event["rounds"][0]["format"] = 'a'

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "ignores setting time limit for 333mbf and 333fm" do
      wcif_333mbf_event = wcif["events"].find { |e| e["id"] == "333mbf" }
      wcif_333mbf_event["rounds"][0]["timeLimit"] = {
        "centiseconds" => 30.minutes.in_centiseconds,
        "cumulativeRoundIds" => [],
      }

      wcif_333fm_event = wcif["events"].find { |e| e["id"] == "333fm" }
      wcif_333fm_event["rounds"][0]["timeLimit"] = {
        "centiseconds" => 30.minutes.in_centiseconds,
        "cumulativeRoundIds" => [],
      }

      competition.set_wcif_events!(wcif["events"], delegate)

      wcif_333mbf_event["rounds"][0]["timeLimit"] = nil
      wcif_333fm_event["rounds"][0]["timeLimit"] = nil

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "can set scrambleSetCount" do
      wcif_333mbf_event = wcif["events"].find { |e| e["id"] == "333mbf" }
      wcif_333mbf_event["rounds"][0]["scrambleSetCount"] = 32

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    context "linked rounds" do
      let(:wcif_version) { '2.1.1' }

      it "links rounds that were previously not linked" do
        wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }

        wcif_333_event["rounds"][0]["linkedRounds"] = %w[333-r1 333-r2]
        wcif_333_event["rounds"][1]["linkedRounds"] = %w[333-r1 333-r2]
        wcif_333_event["rounds"][1]["participationRuleset"] = wcif_333_event["rounds"][0]["participationRuleset"]

        competition.set_wcif_events!(wcif["events"], delegate, version: wcif_version)

        expect(competition.to_wcif(version: wcif_version)["events"]).to eq(wcif["events"])

        expect(LinkedRound.count).to be 1

        expect(round333_1.reload.linked_round).not_to be_nil
        expect(round333_2.reload.linked_round).not_to be_nil

        # already reloaded everything above
        expect(round333_1.linked_round).to eq(round333_2.linked_round)
      end

      it "unlinks rounds that had previously been linked" do
        # Synchronize cutoff to allow linking further down
        round333_2.update!(cutoff: sixty_second_2_attempt_cutoff)

        # store a copy of the WCIF before making any changes, so the rounds are NOT linked
        wcif_unlinked = wcif["events"].deep_dup

        linked_round = create(:linked_round)

        round333_1.update!(linked_round: linked_round)
        round333_2.update!(linked_round: linked_round)

        expect(competition.to_wcif(version: wcif_version)["events"]).not_to eq(wcif_unlinked)

        competition.set_wcif_events!(wcif_unlinked, delegate, version: wcif_version)
        expect(competition.to_wcif(version: wcif_version)["events"]).to eq(wcif_unlinked)

        # Our cleanup code picks up orphaned rounds, see the model spec for linked_round.rb
        expect(LinkedRound.count).to be 0
      end

      context "malformed linked_rounds entries" do
        let(:round333_3) { build(:round, number: 3, total_number_of_rounds: 3, participation_source: round333_2, participation_condition: top_16_average_condition) }

        before :each do
          round333_1.update!(total_number_of_rounds: 3)
          round333_2.update!(total_number_of_rounds: 3)

          event_333.update!(rounds: [round333_1, round333_2, round333_3])
        end

        it "throws when rounds are giving inconsistent information" do
          wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }

          # Explicitly ONLY setting R1 here, which is inconsistent. R2 _should_ also know about the linking
          wcif_333_event["rounds"][0]["linkedRounds"] = %w[333-r1 333-r2]

          expect { competition.set_wcif_events!(wcif["events"], delegate, version: wcif_version) }.to raise_error(WcaExceptions::BadApiParameter) do |ex|
            expect(ex.message).to eq("The linking for round 333-r1 does not match the linking of rounds [333-r2]")
          end
        end

        it "throws when rounds are giving individually valid but different linking information" do
          wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }

          # Each linking is theoretically valid, but they do not match with each other
          wcif_333_event["rounds"][0]["linkedRounds"] = %w[333-r1 333-r2]
          wcif_333_event["rounds"][1]["linkedRounds"] = %w[333-r2 333-r3]

          expect { competition.set_wcif_events!(wcif["events"], delegate, version: wcif_version) }.to raise_error(WcaExceptions::BadApiParameter) do |ex|
            expect(ex.message).to eq("The linking for round 333-r1 does not match the linking of rounds [333-r2]")
          end
        end

        it "throws when rounds are giving obviously bogus information" do
          wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }

          # The linking is not valid because it is not self-contained
          wcif_333_event["rounds"][0]["linkedRounds"] = %w[333-r2 333-r3]

          expect { competition.set_wcif_events!(wcif["events"], delegate, version: wcif_version) }.to raise_error(WcaExceptions::BadApiParameter) do |ex|
            expect(ex.message).to eq("The linking for round 333-r1 must contain itself")
          end

          # The linking is not valid because it references a round that does not exist
          wcif_333_event["rounds"][0]["linkedRounds"] = %w[333-r1 333-r4]

          expect { competition.set_wcif_events!(wcif["events"], delegate, version: wcif_version) }.to raise_error(WcaExceptions::BadApiParameter) do |ex|
            expect(ex.message).to eq("The linking for round 333-r1 references non-existing rounds [333-r4]")
          end

          # The linking is not valid because it is of length 1
          wcif_333_event["rounds"][0]["linkedRounds"] = %w[333-r1]

          expect { competition.set_wcif_events!(wcif["events"], delegate, version: wcif_version) }.to raise_error(WcaExceptions::BadApiParameter) do |ex|
            expect(ex.message).to eq("The linking for round 333-r1 must be longer than one entry")
          end
        end
      end
    end

    context "round results" do
      let(:competitors) { create_list(:registration, 2, :accepted, competition: competition) }
      let(:wcif_333_event) { wcif["events"].find { |e| e["id"] == "333" } }

      before :each do
        wcif_333_event["rounds"][0]["results"] = [
          {
            "personId" => competitors[0].registrant_id,
            "ranking" => 10,
            "attempts" => [{ "result" => 456, "reconstruction" => nil }] * 5,
            "best" => 456,
            "average" => 456,
          },
          {
            "personId" => competitors[1].registrant_id,
            "ranking" => 5,
            "attempts" => [{ "result" => 784, "reconstruction" => nil }] * 5,
            "best" => 784,
            "average" => 784,
          },
        ]
      end

      it "can set round results" do
        competition.set_wcif_events!(wcif["events"], delegate)

        expect(competition.to_wcif["events"]).to eq(wcif["events"])
      end

      it "records histories when something changes" do
        competition.set_wcif_events!(wcif["events"], delegate)

        expect(LiveResult.count).to eq(2)
        expect(LiveResultHistoryEntry.count).to eq(2)

        wcif_333_event["rounds"][0]["results"][1] = {
          "personId" => competitors[1].registrant_id,
          "ranking" => 5,
          "attempts" => ([{ "result" => 784, "reconstruction" => nil }] * 4) | [{ "result" => 987, "reconstruction" => nil }],
          "best" => 784,
          "average" => 784,
        }

        competition.set_wcif_events!(wcif["events"], delegate)

        # Still have the same amount of results, but one more history
        expect(LiveResult.count).to eq(2)
        expect(LiveResultHistoryEntry.count).to eq(3)
        expect(LiveResultHistoryEntry.last.action_type).to eq("scoretaking")
      end

      it "records histories when a new score was added" do
        competition.set_wcif_events!(wcif["events"], delegate)

        expect(LiveResult.count).to eq(2)
        expect(LiveResultHistoryEntry.count).to eq(2)

        another_competitor = create(:registration, :accepted, competition: competition)

        wcif_333_event["rounds"][0]["results"] << {
          "personId" => another_competitor.registrant_id,
          "ranking" => 2,
          "attempts" => [{ "result" => 123, "reconstruction" => nil }] * 5,
          "best" => 123,
          "average" => 123,
        }

        competition.set_wcif_events!(wcif["events"], delegate)

        # A new result was added and this result also needs a history entry
        expect(LiveResult.count).to eq(3)
        expect(LiveResultHistoryEntry.count).to eq(3)
        expect(LiveResultHistoryEntry.last.action_type).to eq("scoretaking")
      end

      it "does not record redundant histories" do
        competition.set_wcif_events!(wcif["events"], delegate)

        expect(LiveResult.count).to eq(2)
        expect(LiveResultHistoryEntry.count).to eq(2)

        # Imagine that somebody hits the sync button twice, "just to be sure"
        competition.set_wcif_events!(wcif["events"], delegate)

        # Nothing in the data actually changed, so both the normal results
        # as well as the history describing changes to the results should remain unchanged
        expect(LiveResult.count).to eq(2)
        expect(LiveResultHistoryEntry.count).to eq(2)
      end

      it "syncing new empty results records 'opened' action" do
        competition.set_wcif_events!(wcif["events"], delegate)

        expect(LiveResult.count).to eq(2)
        expect(LiveResultHistoryEntry.count).to eq(2)

        wcif_333_event["rounds"][1]["results"] = [{
          "personId" => competitors[1].registrant_id,
          "ranking" => 2,
          "attempts" => [], # This is how WCA Live sends us new opened results
          "best" => 0,
          "average" => 0,
        }]

        competition.set_wcif_events!(wcif["events"], delegate)

        # A new result was added and this result also needs a history entry
        expect(LiveResult.count).to eq(3)
        expect(LiveResultHistoryEntry.count).to eq(3)
        expect(LiveResultHistoryEntry.last.action_type).to eq("opened")
      end
    end

    it "can set event and round extensions" do
      wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }
      wcif_333_event["extensions"] = [
        {
          "id" => "com.third.party.event",
          "specUrl" => "https://example.com/event.json",
          "data" => {
            "prizes" => ['100$', '50$', '20$'],
          },
        },
      ]
      wcif_333_event["rounds"][0]["extensions"] = [
        {
          "id" => "com.third.party.round",
          "specUrl" => "https://example.com/round.json",
          "data" => {
            "displays" => 10,
          },
        },
      ]

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "leaves round extensions untouched when none are submitted" do
      wcif_333mbf_event = wcif["events"].find { |e| e["id"] == "333mbf" }
      extensions = wcif_333mbf_event["rounds"][0].delete("extensions")

      competition.set_wcif_events!(wcif["events"], delegate)

      wcif_333mbf_event["rounds"][0]["extensions"] = extensions
      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "can set event qualifications" do
      wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }
      wcif_333_event["qualification"] = {
        "resultType" => "average",
        "type" => "attemptResult",
        "whenDate" => "2021-07-01",
        "level" => 6000,
      }

      competition.set_wcif_events!(wcif["events"], delegate)

      expect(competition.to_wcif["events"]).to eq(wcif["events"])

      # Checking whether the backporting worked as expected
      competition_333_event = competition.competition_events.find { it.event_id == '333' }

      expect(competition_333_event.qualification_latest_date).to eq(Date.new(2021, 7, 1))
      expect(competition_333_event.qualification_condition).not_to be_nil
    end
  end

  describe "#set_wcif_schedule!" do
    let(:schedule_wcif) { competition.to_wcif["schedule"] }
    let(:competition_start_time) { competition.start_date.to_time }

    context "activities" do
      it "Removing activities works and destroy nested activities" do
        activity_with_child = schedule_wcif["venues"][0]["rooms"][0]["activities"].find { |a| a["id"] == 1 }
        activity_with_child["childActivities"] = []

        competition.set_wcif_schedule!(schedule_wcif)

        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        expect(ScheduleActivity.all.size).to eq 7
      end

      it "Updating activity's attributes correctly updates the existing object" do
        first_venue = schedule_wcif["venues"][0]
        first_room = first_venue["rooms"][0]
        second_activity = first_room["activities"][1]
        activity_object = competition.competition_venues.find_by(wcif_id: first_venue["id"])
                                     .venue_rooms.find_by(wcif_id: first_room["id"])
                                     .schedule_activities.find_by(wcif_id: second_activity["id"])

        second_activity["name"] = "activity name"
        second_activity["activityCode"] = "222-r1"
        second_activity["startTime"] = (activity_object.start_time + 20.minutes).iso8601
        second_activity["endTime"] = (activity_object.end_time + 20.minutes).iso8601
        competition.set_wcif_schedule!(schedule_wcif)
        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        activity_object.reload
        expect(activity_object.name).to eq "activity name"
        expect(activity_object.activity_code).to eq "222-r1"
        expect(activity_object.start_time).to eq second_activity["startTime"]
        expect(activity_object.end_time).to eq second_activity["endTime"]
      end

      it "Creating nested activities works" do
        new_activity = {
          "id" => 44,
          "name" => "2x2 First round",
          "activityCode" => "222-r1",
          "startTime" => competition_start_time.change(hour: 9, min: 0, sec: 0).utc.iso8601,
          "endTime" => competition_start_time.change(hour: 9, min: 30, sec: 0).utc.iso8601,
          "childActivities" => [
            {
              "id" => 45,
              "name" => "2x2 First round group 1",
              "activityCode" => "222-r1-g1",
              "startTime" => competition_start_time.change(hour: 9, min: 0, sec: 0).utc.iso8601,
              "endTime" => competition_start_time.change(hour: 9, min: 15, sec: 0).utc.iso8601,
              "childActivities" => [],
              "extensions" => [],
            },
          ],
          "extensions" => [],
        }
        schedule_wcif["venues"][0]["rooms"][0]["activities"] << new_activity
        competition.set_wcif_schedule!(schedule_wcif)
        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        competition.reload
        activity = competition.competition_venues.first.venue_rooms.first.schedule_activities.find_by(wcif_id: 44)
        expect(activity.name).to eq "2x2 First round"
        expect(activity.activity_code).to eq "222-r1"
        expect(activity.start_time).to eq new_activity["startTime"]
        expect(activity.end_time).to eq new_activity["endTime"]
        expect(activity.child_activities.size).to eq 1
        child_activity = activity.child_activities.first
        expect(child_activity.wcif_id).to eq 45
        expect(child_activity.name).to eq "2x2 First round group 1"
        expect(child_activity.activity_code).to eq "222-r1-g1"
        expect(child_activity.start_time).to eq new_activity["childActivities"][0]["startTime"]
        expect(child_activity.end_time).to eq new_activity["childActivities"][0]["endTime"]
      end

      it "Doesn't update with an invalid activity code" do
        # Try updating an activity with an invalid activity code
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][0]
        activity["activityCode"] = "sneakycode"
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
        competition.reload
        # 'other' is a valid base, but "blabla" is not a valid 'other' activity
        activity["activityCode"] = "other-blabla"
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
        # restore to valid value
        activity["activityCode"] = "other-lunch"
        competition.reload

        # Try updating a nested activity with an invalid activity code
        # The activity is actually 333fm-r1
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][1]
        activity["childActivities"] << {
          "id" => 33,
          "name" => "nested with wrong code",
          "activityCode" => "444",
          "startTime" => activity["startTime"],
          "endTime" => activity["endTime"],
          "childActivities" => [],
        }
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it "accepts a valid start time from the day before the competition" do
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][1]
        # Set the start time to a timezone ahead of UTC (meaning if we transform the
        # time to UTC, the day will actually be the day before the competition).
        # It's fine because at least one timezone had entered the day of the competition.
        activity["startTime"] = competition.start_date.to_time.change(hour: 1, offset: "+08:00").iso8601
        competition.set_wcif_schedule!(schedule_wcif)
      end

      it "accepts a valid end time from the day after the competition" do
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][1]
        # Set the start time to a timezone behind UTC (meaning if we transform the
        # time to UTC, the day will actually be the day after the competition).
        # It's fine because at least one timezone is still in the last day of the competition.
        activity["endTime"] = competition.end_date.to_time.change(hour: 20, offset: "-08:00").iso8601
        competition.set_wcif_schedule!(schedule_wcif)
      end

      it "Doesn't update with an past start time" do
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][1]
        activity["startTime"] = (competition.start_date - 1.day).to_time.iso8601
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it "Doesn't update with an future end time" do
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][1]
        activity["endTime"] = (competition.end_time + 1.minute).iso8601
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it "Doesn't update a nested activity which is not included in parent" do
        # Let's try first a past date
        activity = schedule_wcif["venues"][0]["rooms"][0]["activities"][0]
        nested_activity = activity["childActivities"][0]
        # Get rid of nested-nested, to make sure we don't run into their validations
        nested_activity["childActivities"] = []
        activity_start = Time.parse(activity["startTime"])
        activity_end = Time.parse(activity["endTime"])
        nested_activity["startTime"] = (activity_start - 1.minute).iso8601
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
        competition.reload
        nested_activity["startTime"] = activity_start.iso8601
        nested_activity["endTime"] = (activity_end + 1.minute).iso8601
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
        competition.reload
        # Try putting valid start/end time but with end time before start time
        nested_activity["endTime"] = activity_start.iso8601
        nested_activity["startTime"] = activity_end.iso8601
        expect { competition.set_wcif_schedule!(schedule_wcif) }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context "venues" do
      it "Removing venues works and destroys nested rooms and activities" do
        schedule_wcif["venues"] = []

        competition.set_wcif_schedule!(schedule_wcif)

        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        expect(VenueRoom.all.size).to eq 0
        expect(ScheduleActivity.all.size).to eq 0
      end

      it "Updating venue's attributes correctly updates the existing object" do
        first_venue = schedule_wcif["venues"][0]
        venue_object = competition.competition_venues.find_by(wcif_id: first_venue["id"])

        first_venue["name"] = "new name"
        first_venue["latitudeMicrodegrees"] = 0
        first_venue["longitudeMicrodegrees"] = 0
        first_venue["timezone"] = "Europe/Madrid"

        competition.set_wcif_schedule!(schedule_wcif)
        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        venue_object.reload
        expect(venue_object.name).to eq "new name"
        expect(venue_object.latitude_microdegrees).to eq 0
        expect(venue_object.longitude_microdegrees).to eq 0
        expect(venue_object.timezone_id).to eq "Europe/Madrid"
      end

      it "Creating venue works" do
        schedule_wcif["venues"] << {
          "id" => 44,
          "name" => "My new venue",
          "countryIso2" => "GB",
          "latitudeMicrodegrees" => 123,
          "longitudeMicrodegrees" => 456,
          "timezone" => "Europe/London",
          "rooms" => [],
          "extensions" => [],
        }
        competition.set_wcif_schedule!(schedule_wcif)
        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        competition.reload
        venue = competition.competition_venues.find_by(wcif_id: 44)
        expect(venue.name).to eq "My new venue"
        expect(venue.country_iso2).to eq "GB"
        expect(venue.latitude_microdegrees).to eq 123
        expect(venue.longitude_microdegrees).to eq 456
        expect(venue.timezone_id).to eq "Europe/London"
      end
    end

    context "rooms" do
      it "Removing rooms works and destroy nested activities" do
        schedule_wcif["venues"][0]["rooms"].delete_at(0)

        competition.set_wcif_schedule!(schedule_wcif)

        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        expect(ScheduleActivity.all.size).to eq 0
      end

      it "Updating room's attributes correctly updates the existing object" do
        first_venue = schedule_wcif["venues"][0]
        first_room = first_venue["rooms"][0]
        room_object = competition.competition_venues.find_by(wcif_id: first_venue["id"]).venue_rooms.find_by(wcif_id: first_room["id"])

        first_room["name"] = "new room name"
        first_room["activities"] = []
        competition.set_wcif_schedule!(schedule_wcif)
        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        room_object.reload
        expect(room_object.name).to eq "new room name"
        expect(room_object.schedule_activities.size).to eq 0
      end

      it "Creating room works" do
        schedule_wcif["venues"][0]["rooms"] << {
          "id" => 44,
          "name" => "Hippolyte's backyard",
          "color" => VenueRoom::DEFAULT_ROOM_COLOR,
          "activities" => [],
          "extensions" => [],
        }
        competition.set_wcif_schedule!(schedule_wcif)
        expect(competition.to_wcif["schedule"]).to eq(schedule_wcif)
        competition.reload
        room = competition.competition_venues.first.venue_rooms.find_by(wcif_id: 44)
        expect(room.name).to eq "Hippolyte's backyard"
      end
    end
  end

  describe "#set_wcif!" do
    let(:wcif) { competition.to_wcif }

    context "validates the given data with JSON Schema definition" do
      it "Doesn't update invalid venue" do
        %w[id name latitudeMicrodegrees longitudeMicrodegrees timezone rooms].each do |attr|
          save_attr = wcif["schedule"]["venues"][0][attr]
          wcif["schedule"]["venues"][0][attr] = nil
          expect { competition.set_wcif!(wcif, delegate) }.to raise_error(JSON::Schema::ValidationError)
          wcif["schedule"]["venues"][0][attr] = save_attr
        end
      end

      it "Doesn't update invalid activity" do
        %w[id name childActivities activityCode startTime endTime].each do |attr|
          save_attr = wcif["schedule"]["venues"][0]["rooms"][0]["activities"][0][attr]
          wcif["schedule"]["venues"][0]["rooms"][0]["activities"][0][attr] = nil
          expect { competition.set_wcif!(wcif, delegate) }.to raise_error(JSON::Schema::ValidationError)
          wcif["schedule"]["venues"][0]["rooms"][0]["activities"][0][attr] = save_attr
        end
      end

      it "Doesn't update invalid room" do
        %w[id name activities].each do |attr|
          save_attr = wcif["schedule"]["venues"][0]["rooms"][0][attr]
          wcif["schedule"]["venues"][0]["rooms"][0][attr] = nil
          expect { competition.set_wcif!(wcif, delegate) }.to raise_error(JSON::Schema::ValidationError)
          wcif["schedule"]["venues"][0]["rooms"][0][attr] = save_attr
        end
      end
    end

    it "allows adding assignments for newly added activities" do
      registration = create(:registration, :accepted, competition: competition)
      activities = wcif["schedule"]["venues"][0]["rooms"][0]["activities"]
      activities << {
        "id" => 1000,
        "name" => "Some stuff going on",
        "activityCode" => "other-misc-stuff",
        "startTime" => activities.last["startTime"],
        "endTime" => activities.last["endTime"],
        "childActivities" => [],
        "extensions" => [],
      }
      wcif["persons"].find { |person| person["wcaUserId"] == registration.user.id }["assignments"] << {
        "activityId" => 1000,
        "assignmentCode" => "competitor",
      }
      expect { competition.set_wcif!(wcif, delegate) }.to change { registration.assignments.count }.by(1)
    end
  end
end
