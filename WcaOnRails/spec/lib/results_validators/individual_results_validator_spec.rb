# frozen_string_literal: true

require 'rails_helper'

RV=ResultsValidators
IRV=RV::IndividualResultsValidator

RSpec.describe IRV do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, :past, event_ids: ["333oh", "444", "333mbf"]) }
    let!(:competition2) { FactoryBot.create(:competition, :past, event_ids: ["222", "555", "666", "777", "333fm"]) }

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

    # Triggers MBF_RESULT_OVER_TIME_LIMIT_WARNING
    # Triggers RESULT_AFTER_DNS_WARNING
    # Triggers SIMILAR_RESULTS_WARNING
    # Triggers MISMATCHED_RESULT_FORMAT_ERROR
    # Triggers NO_ROUND_INFORMATION_WARNING
    # Triggers SUSPICIOUS_DNF_WARNING

    it "triggers errors on cutoff and time limits" do
      # Triggers:
      # DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR
      # RESULT_OVER_TIME_LIMIT_ERROR
      # MET_CUTOFF_MISSING_RESULTS_ERROR
      # RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR
      # MISSING_CUMULATIVE_ROUND_ID_ERROR

      cutoff = Cutoff.new(number_of_attempts: 2, attempt_result: 50*100)
      cutoff_fm = Cutoff.new(number_of_attempts: 2, attempt_result: 35)
      time_limit = TimeLimit.new(centiseconds: 2.minutes.in_centiseconds, cumulative_round_ids: [])
      round44 = FactoryBot.create(:round, competition: competition1, event_id: "444", cutoff: cutoff, time_limit: time_limit)
      round_fm = FactoryBot.create(:round, competition: competition2, event_id: "333fm", cutoff: cutoff_fm, format_id: "m")
      cumul_valid = TimeLimit.new(centiseconds: 8.minutes.in_centiseconds, cumulative_round_ids: ["555-r1", "666-r1"])
      round55 = FactoryBot.create(:round, competition: competition2, event_id: "555", time_limit: cumul_valid)
      FactoryBot.create(:round, competition: competition2, event_id: "666", time_limit: cumul_valid, format_id: "m")

      # This cumulative time limit is invalid as it refers to an unexisting round.
      # It can happen at the moment see:
      # https://github.com/thewca/worldcubeassociation.org/issues/3254
      cumul_invalid = TimeLimit.new(centiseconds: 8.minutes.in_centiseconds, cumulative_round_ids: ["444-r1", "777-r1"])
      FactoryBot.create(:round, competition: competition2, event_id: "777", time_limit: cumul_invalid, format_id: "m")

      expected_errors = {
        "Result": [],
        "InboxResult": [],
      }

      # Here the positions will be messed up but this is fine, we don't run the PositionsValidator.
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        errs = []
        # Creates a result which doesn't meet the cutoff
        create_over_cutoff(result_kind, competition1, cutoff, "444")

        # Creates a result which doesn't meet the cutoff but yet has extra values
        res_over_with_results = create_over_cutoff(result_kind, competition1, cutoff, "444")
        res_over_with_results.update!(value3: res_over_with_results.value2,
                                      value4: res_over_with_results.value2,
                                      value5: res_over_with_results.value2,
                                      average: res_over_with_results.value2)

        errs << RV::ValidationError.new(:results, competition1.id,
                                        IRV::DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR,
                                        round_id: "444-c",
                                        person_name: name_for_result(res_over_with_results),
                                        cutoff: cutoff.to_s(round44))

        # Create a result which meets the cutoff but has one result over the time limit
        res_over_limit = FactoryBot.create(result_kind, competition: competition1,
                                                        eventId: "444",
                                                        best: 4000, average: 4200,
                                                        roundTypeId: "c")
        res_over_limit.update(value5: 12_001)

        errs << RV::ValidationError.new(:results, competition1.id,
                                        IRV::RESULT_OVER_TIME_LIMIT_ERROR,
                                        round_id: "444-c",
                                        person_name: name_for_result(res_over_limit),
                                        time_limit: time_limit.to_s(round44))

        # Create a result which meets the cutoff but doesn't have all the necessary values
        res_fm = create_over_cutoff(result_kind, competition2, cutoff_fm, "333fm")
        res_fm.update(value1: 30, formatId: "m")

        errs << RV::ValidationError.new(:results, competition2.id,
                                        IRV::MET_CUTOFF_MISSING_RESULTS_ERROR,
                                        round_id: "333fm-c",
                                        person_name: name_for_result(res_fm),
                                        cutoff: cutoff_fm.to_s(round_fm))

        res_cumul = FactoryBot.create(result_kind, :mo3, competition: competition2, eventId: "666", best: 6000)
        FactoryBot.create(result_kind, competition: competition2, eventId: "555", best: 6000, average: 6000, person: person_for_result(res_cumul))

        errs << RV::ValidationError.new(:results, competition2.id,
                                        IRV::RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR,
                                        round_ids: "555-f,666-f",
                                        person_name: name_for_result(res_cumul),
                                        time_limit: cumul_valid.to_s(round55))

        FactoryBot.create(result_kind, :mo3, competition: competition2, eventId: "777")

        errs << RV::ValidationError.new(:results, competition2.id,
                                        IRV::MISSING_CUMULATIVE_ROUND_ID_ERROR,
                                        original_round_id: "777-f",
                                        wcif_id: "444-r1")

        expected_errors[model.to_s] = errs
      end
      validator_args.each do |arg|
        irv = IRV.new.validate(arg)
        expect(irv.errors).to match_array(expected_errors[arg[:model].to_s])
      end
    end
  end
end

def create_over_cutoff(kind, competition, cutoff, event_id)
  attributes = {
    competition: competition,
    eventId: event_id,
    value1: cutoff.attempt_result + 100,
    value2: cutoff.attempt_result + 200,
    value3: 0,
    value4: 0,
    value5: 0,
    best: cutoff.attempt_result + 100,
    average: 0,
    roundTypeId: "c",
  }
  FactoryBot.create(kind, attributes)
end

def name_for_result(result)
  result.respond_to?(:personName) ? result.personName : InboxPerson.find_by(id: result.personId).name
end

def person_for_result(result)
  result.class == Result ? Person.find_by(wca_id: result.personId) : InboxPerson.find_by(id: result.personId)
end
