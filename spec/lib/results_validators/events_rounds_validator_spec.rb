# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
ERV = RV::EventsRoundsValidator

RSpec.describe ERV do
  context "on InboxResult and Result" do
    let!(:competition1) { create(:competition, :past, event_ids: %w[333 333oh], main_event_id: nil) }
    let!(:competition2) { create(:competition, :past, event_ids: %w[222 555], main_event_id: "222") }

    # The idea behind this variable is the following: the validator can be applied
    # on either a particular model for given competition ids, or on a set of results.
    # We simply want to check it has the expected behavior on all the possible cases.
    let(:validator_args) do
      [InboxResult, Result].flat_map do |model|
        [
          { competition_ids: [competition1.id, competition2.id], model: model },
          { results: model.where(competition_id: [competition1.id, competition2.id]), model: model },
        ]
      end
    end

    it "triggers events-related errors and warnings" do
      # Triggers:
      # NOT_333_MAIN_EVENT_WARNING
      # NO_MAIN_EVENT_WARNING
      # MISSING_RESULTS_WARNING
      # UNEXPECTED_COMBINED_ROUND_ERROR
      round_333oh = create(:round, event_id: "333oh", competition: competition1)
      round_222 = create(:round, event_id: "222", competition: competition2)
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        create(result_kind, competition: competition1, event_id: "333oh", round: round_333oh)
        create(result_kind, competition: competition2, event_id: "222", round: round_222)
      end

      expected_warnings = [
        RV::ValidationWarning.new(ERV::NO_MAIN_EVENT_WARNING,
                                  :events, competition1.id),
        RV::ValidationWarning.new(ERV::NOT_333_MAIN_EVENT_WARNING,
                                  :events, competition2.id,
                                  main_event_id: "222"),
        RV::ValidationWarning.new(ERV::MISSING_RESULTS_WARNING,
                                  :events, competition2.id,
                                  event_id: "555"),
        RV::ValidationWarning.new(ERV::MISSING_RESULTS_WARNING,
                                  :events, competition1.id,
                                  event_id: "333"),
      ]

      expected_errors = []

      validator_args.each do |arg|
        erv = ERV.new.validate(**arg)
        expect(erv.warnings).to match_array(expected_warnings)
        expect(erv.errors).to match_array(expected_errors)
      end
    end

    it "triggers rounds-related errors and warnings" do
      # Triggers:
      # NOT_333_MAIN_EVENT_WARNING
      # NO_MAIN_EVENT_WARNING
      # UNEXPECTED_ROUND_RESULTS_ERROR
      # MISSING_ROUND_RESULTS_ERROR
      cutoff = Cutoff.new(number_of_attempts: 2, attempt_result: 50 * 100)
      # Add some rounds to trigger the rounds validation.
      round_333_oh_1 = create(:round,
             competition: competition1, event_id: "333oh",
             total_number_of_rounds: 2)
      # This round is added to trigger the missing round error.
      round_333_oh_f =  create(:round,
             competition: competition1, event_id: "333oh",
             number: 2, total_number_of_rounds: 2)
      round_333_f = create(:round, competition: competition1, event_id: "333")
      round_555_f = create(:round, competition: competition2, event_id: "555",
                     cutoff: cutoff)

      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Create a result over a cutoff which does not exist in rounds data.
        create(result_kind, :over_cutoff, :skip_validation,
               competition: competition1, event_id: "333oh",
               cutoff: cutoff, round: round_333_oh_1)
        create(result_kind, competition: competition1, event_id: "333", round: round_333_f)
        # This creates results below the cutoff for 5x5, which effectively turns
        # it into a "regular" round instead of a cutoff round.
        create(result_kind, :skip_validation,
               competition: competition2, event_id: "555", round: round_555_f)
      end
      expected_errors = [
        RV::ValidationError.new(ERV::UNEXPECTED_COMBINED_ROUND_ERROR,
                                :rounds, competition1.id,
                                round_name: "3x3x3 One-Handed Final"),
        RV::ValidationError.new(ERV::MISSING_ROUND_RESULTS_ERROR,
                                :rounds, competition1.id,
                                round_id: "333oh-1"),
      ]

      expected_warnings = [
        RV::ValidationWarning.new(ERV::NO_MAIN_EVENT_WARNING,
                                  :events, competition1.id),
        RV::ValidationWarning.new(ERV::NOT_333_MAIN_EVENT_WARNING,
                                  :events, competition2.id,
                                  main_event_id: "222"),
        RV::ValidationWarning.new(ERV::MISSING_RESULTS_WARNING,
                                  :events, competition2.id,
                                  event_id: "222"),
      ]
      validator_args.each do |arg|
        erv = ERV.new.validate(**arg)
        expect(erv.warnings).to match_array(expected_warnings)
        expect(erv.errors).to match_array(expected_errors)
      end
    end
  end
end
