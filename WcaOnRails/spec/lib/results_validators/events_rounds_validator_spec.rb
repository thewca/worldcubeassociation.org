# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
ERV = RV::EventsRoundsValidator

RSpec.describe ERV do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, :past, event_ids: ["333", "333oh"]) }
    let!(:competition2) { FactoryBot.create(:competition, :past, event_ids: ["222", "555"]) }

    # The idea behind this variable is the following: the validator can be applied
    # on either a particular model for given competition ids, or on a set of results.
    # We simply want to check it has the expected behavior on all the possible cases.
    let(:validator_args) {
      [InboxResult, Result].flat_map { |model|
        [
          { competition_ids: [competition1.id, competition2.id], model: model },
          { results: model.sorted_for_competitions([competition1.id, competition2.id]), model: model },
        ]
      }
    }

    it "triggers events-related errors and warnings" do
      # Triggers:
      # CHOOSE_MAIN_EVENT_WARNING
      # UNEXPECTED_RESULTS_ERROR
      # MISSING_RESULTS_WARNING
      # UNEXPECTED_COMBINED_ROUND_ERROR
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        FactoryBot.create(result_kind, competition: competition1, eventId: "333oh")
        FactoryBot.create(result_kind, competition: competition2, eventId: "222")
        FactoryBot.create(result_kind, competition: competition2, eventId: "444")
      end

      expected_warnings = [
        RV::ValidationWarning.new(:events, competition1.id,
                                  ERV::CHOOSE_MAIN_EVENT_WARNING),
        RV::ValidationWarning.new(:events, competition2.id,
                                  ERV::CHOOSE_MAIN_EVENT_WARNING),
        RV::ValidationWarning.new(:events, competition2.id,
                                  ERV::MISSING_RESULTS_WARNING,
                                  event_id: "555"),
        RV::ValidationWarning.new(:events, competition1.id,
                                  ERV::MISSING_RESULTS_WARNING,
                                  event_id: "333"),
      ]

      expected_errors = [
        RV::ValidationError.new(:events, competition2.id,
                                ERV::UNEXPECTED_RESULTS_ERROR,
                                event_id: "444"),
      ]

      validator_args.each do |arg|
        erv = ERV.new.validate(arg)
        expect(erv.warnings).to match_array(expected_warnings)
        expect(erv.errors).to match_array(expected_errors)
      end
    end

    it "triggers rounds-related errors and warnings" do
      # Triggers:
      # CHOOSE_MAIN_EVENT_WARNING
      # UNEXPECTED_ROUND_RESULTS_ERROR
      # MISSING_ROUND_RESULTS_ERROR
      cutoff = Cutoff.new(number_of_attempts: 2, attempt_result: 50*100)
      # Add some rounds to trigger the rounds validation.
      FactoryBot.create(:round,
                        competition: competition1, event_id: "333oh",
                        total_number_of_rounds: 2)
      # This round is added to trigger the missing round error.
      FactoryBot.create(:round,
                        competition: competition1, event_id: "333oh",
                        number: 2, total_number_of_rounds: 2)
      FactoryBot.create(:round, competition: competition1, event_id: "333")
      FactoryBot.create(:round, competition: competition2, event_id: "555",
                                cutoff: cutoff)

      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Create a result over a cutoff which does not exist in rounds data.
        FactoryBot.create(result_kind, :over_cutoff,
                          competition: competition1, eventId: "333oh",
                          cutoff: cutoff)
        FactoryBot.create(result_kind, competition: competition1, eventId: "333")
        # This creates results below the cutoff for 5x5, which effectively turns
        # it into a "regular" round instead of a combined round.
        FactoryBot.create(result_kind, competition: competition2, eventId: "555")
        FactoryBot.create(result_kind,
                          competition: competition2, eventId: "222", roundTypeId: "c")
      end
      expected_errors = [
        RV::ValidationError.new(:rounds, competition1.id,
                                ERV::UNEXPECTED_COMBINED_ROUND_ERROR,
                                round_name: "3x3x3 One-Handed Final"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ERV::MISSING_ROUND_RESULTS_ERROR,
                                round_id: "333oh-1"),
        RV::ValidationError.new(:rounds, competition2.id,
                                ERV::UNEXPECTED_ROUND_RESULTS_ERROR,
                                round_id: "222-c"),
      ]

      expected_warnings = [
        RV::ValidationWarning.new(:events, competition2.id,
                                  ERV::CHOOSE_MAIN_EVENT_WARNING),
      ]
      validator_args.each do |arg|
        erv = ERV.new.validate(arg)
        expect(erv.warnings).to match_array(expected_warnings)
        expect(erv.errors).to match_array(expected_errors)
      end
    end
  end
end
