# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Competition WCIF" do
  let!(:competition) {
    FactoryGirl.create(
      :competition,
      :with_delegate,
      id: "TestComp2014",
      name: "Test Comp 2014",
      start_date: "2014-02-03",
      end_date: "2014-02-05",
      external_website: "http://example.com",
      showAtAll: true,
      event_ids: %w(333 444),
    )
  }
  let(:delegate) { competition.delegates.first }
  let(:sixty_second_2_attempt_cutoff) { Cutoff.new(number_of_attempts: 2, attempt_result: 1.minute.in_centiseconds) }
  let(:top_16_advance) { RankingCondition.new(16) }
  let!(:round333_1) { FactoryGirl.create(:round, competition: competition, event_id: "333", number: 1, cutoff: sixty_second_2_attempt_cutoff, advancement_condition: top_16_advance) }
  let!(:round333_2) { FactoryGirl.create(:round, competition: competition, event_id: "333", number: 2) }
  let!(:round444_1) { FactoryGirl.create(:round, competition: competition, event_id: "444", number: 1) }
  before :each do
    # Load all the rounds we just created.
    competition.reload
  end

  describe "#to_wcif" do
    it "renders a valid WCIF" do
      expect(competition.to_wcif).to eq(
        "formatVersion" => "1.0",
        "id" => "TestComp2014",
        "name" => "Test Comp 2014",
        "persons" => [delegate.to_wcif(competition)],
        "events" => [
          {
            "id" => "333",
            "rounds" => [
              {
                "id" => "333-1",
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
              },
              {
                "id" => "333-2",
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "advancementCondition" => nil,
              },
            ],
          },
          {
            "id" => "444",
            "rounds" => [
              {
                "id" => "444-1",
                "format" => "a",
                "timeLimit" => {
                  "centiseconds" => 10.minutes.in_centiseconds,
                  "cumulativeRoundIds" => [],
                },
                "cutoff" => nil,
                "advancementCondition" => nil,
              },
            ],
          },
        ],
      )
    end
  end

  describe "#set_wcif_events!" do
    let(:wcif) { competition.to_wcif }

    it "removes competition event when wcif rounds are empty" do
      wcif_444_event = wcif["events"].find { |e| e["id"] == "444" }
      wcif_444_event["rounds"] = []

      competition.set_wcif_events!(wcif["events"])

      wcif["events"].reject! { |e| e["id"] == "444" }
      expect(competition.to_wcif["events"]).to eq(wcif["events"])
      expect(competition.events.map(&:id)).to match_array %w(333)
    end

    it "removes competition event when wcif event is missing" do
      wcif["events"].reject! { |e| e["id"] == "444" }

      competition.set_wcif_events!(wcif["events"])

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
      expect(competition.events.map(&:id)).to match_array %w(333)
    end

    it "creates competition event when adding round to previously nonexistent event" do
      wcif["events"] << {
        "id" => "555",
        "rounds" => [
          {
            "id" => "555-1",
            "format" => "3",
            "timeLimit" => {
              "centiseconds" => 3*60*100,
              "cumulativeRoundIds" => [],
            },
            "cutoff" => nil,
            "advancementCondition" => nil,
          },
        ],
      }

      competition.set_wcif_events!(wcif["events"])

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "creates new round when adding round to existing event" do
      wcif_444_event = wcif["events"].find { |e| e["id"] == "444" }
      wcif_444_event["rounds"][0]["advancementCondition"] = {
        "type" => "ranking",
        "level" => 16,
      }
      wcif_444_event["rounds"] << {
        "id" => "444-2",
        "format" => "a",
        "timeLimit" => {
          "centiseconds" => 10.minutes.in_centiseconds,
          "cumulativeRoundIds" => [],
        },
        "cutoff" => nil,
        "advancementCondition" => nil,
      }

      competition.set_wcif_events!(wcif["events"])

      expect(competition.to_wcif["events"]).to eq(wcif["events"])

      # Verify that we can remove the round we just added, so long as we
      # clear the advancementCondition on the first round.
      wcif_444_event["rounds"][0]["advancementCondition"] = nil
      wcif_444_event["rounds"].pop
      competition.set_wcif_events!(wcif["events"])

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end

    it "can change round format to '3'" do
      wcif_333_event = wcif["events"].find { |e| e["id"] == "333" }
      wcif_333_event["rounds"][0]["format"] = '3'

      competition.set_wcif_events!(wcif["events"])

      expect(competition.to_wcif["events"]).to eq(wcif["events"])
    end
  end
end
