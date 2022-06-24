# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
IRV = RV::IndividualResultsValidator

RSpec.describe IRV do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, :past, event_ids: ["333oh", "444", "333mbf", "333bf"]) }
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

    it "triggers errors on cutoff and time limits" do
      # Triggers:
      # DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR
      # RESULT_OVER_TIME_LIMIT_ERROR
      # MET_CUTOFF_MISSING_RESULTS_ERROR
      # RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR
      # MISSING_CUMULATIVE_ROUND_ID_ERROR
      # WRONG_ATTEMPTS_FOR_CUTOFF_ERROR

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
        "Result" => [],
        "InboxResult" => [],
      }

      # Here the positions will be messed up but this is fine, we don't run the PositionsValidator.
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        errs = []
        # Creates a result which doesn't meet the cutoff and is missing values
        # compared to the first phase expected number of attempts.
        res_over_missing_value = FactoryBot.create(result_kind, :over_cutoff,
                                                   competition: competition1,
                                                   cutoff: cutoff, eventId: "444")
        res_over_missing_value.update!(value2: 0)

        errs << RV::ValidationError.new(:results, competition1.id,
                                        IRV::WRONG_ATTEMPTS_FOR_CUTOFF_ERROR,
                                        round_id: "444-c",
                                        person_name: res_over_missing_value.personName)

        # Creates a result which doesn't meet the cutoff but yet has extra values
        res_over_with_results = FactoryBot.create(result_kind, :over_cutoff,
                                                  competition: competition1,
                                                  cutoff: cutoff, eventId: "444")
        res_over_with_results.update!(value3: res_over_with_results.value2,
                                      value4: res_over_with_results.value2,
                                      value5: res_over_with_results.value2,
                                      average: res_over_with_results.value2)

        errs << RV::ValidationError.new(:results, competition1.id,
                                        IRV::DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR,
                                        round_id: "444-c",
                                        person_name: res_over_with_results.personName,
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
                                        person_name: res_over_limit.personName,
                                        time_limit: time_limit.to_s(round44))

        # Create a result which meets the cutoff but doesn't have all the necessary values
        res_fm = FactoryBot.create(result_kind, :over_cutoff,
                                   competition: competition2, cutoff: cutoff_fm,
                                   formatId: "m", eventId: "333fm")
        res_fm.update(value1: 30)

        errs << RV::ValidationError.new(:results, competition2.id,
                                        IRV::MET_CUTOFF_MISSING_RESULTS_ERROR,
                                        round_id: "333fm-c",
                                        person_name: res_fm.personName,
                                        cutoff: cutoff_fm.to_s(round_fm))

        res_cumul = FactoryBot.create(result_kind, :mo3, competition: competition2, eventId: "666", best: 6000)
        FactoryBot.create(result_kind, competition: competition2, eventId: "555", best: 6000, average: 6000, person: person_for_result(res_cumul))

        errs << RV::ValidationError.new(:results, competition2.id,
                                        IRV::RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR,
                                        round_ids: "555-f,666-f",
                                        person_name: res_cumul.personName,
                                        time_limit: cumul_valid.to_s(round55))

        FactoryBot.create(result_kind, :mo3, competition: competition2, eventId: "777")

        errs << RV::ValidationError.new(:results, competition2.id,
                                        IRV::MISSING_CUMULATIVE_ROUND_ID_ERROR,
                                        original_round_id: "777-f",
                                        wcif_id: "444-r1")

        expected_errors[model.to_s] = errs
      end
      validator_args.each do |arg|
        irv = IRV.new.validate(**arg)
        expect(irv.errors).to match_array(expected_errors[arg[:model].to_s])
        expect(irv.warnings).to be_empty
      end
    end

    it "triggers missing round information warning" do
      # Triggers NO_ROUND_INFORMATION_WARNING

      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        FactoryBot.create(result_kind, :skip_validation, competition: competition1, eventId: "333oh", skip_round_creation: true)
      end
      irv = IRV.new.validate(competition_ids: competition1.id)

      expected_warnings = [
        RV::ValidationWarning.new(:results, competition1.id,
                                  IRV::NO_ROUND_INFORMATION_WARNING,
                                  round_id: "333oh-f"),
      ]
      expect(irv.errors).to be_empty
      expect(irv.warnings).to match_array(expected_warnings)
    end

    it "triggers undef time limit warning" do
      # Triggers UNDEF_TL_WARNING

      FactoryBot.create(:round, competition: competition1, event_id: "333oh", format_id: "a", time_limit: nil)
      FactoryBot.create(:result, competition: competition1, eventId: "333oh")
      irv = IRV.new.validate(competition_ids: competition1.id)

      expected_warnings = [
        RV::ValidationWarning.new(:results, competition1.id,
                                  IRV::UNDEF_TL_WARNING,
                                  round_id: "333oh-f"),
      ]
      expect(irv.errors).to be_empty
      expect(irv.warnings).to match_array(expected_warnings)
    end

    it "triggers mismatched result format error" do
      # Triggers MISMATCHED_RESULT_FORMAT_ERROR
      errs = {
        "Result" => [],
        "InboxResult" => [],
      }

      FactoryBot.create(:round, competition: competition1, event_id: "444")

      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        FactoryBot.create(result_kind, competition: competition1, eventId: "444")
        res_ko = FactoryBot.create(result_kind, :skip_validation, :mo3, competition: competition1, eventId: "444", skip_round_creation: true)
        errs[model.to_s] << RV::ValidationError.new(:results, competition1.id,
                                                    IRV::MISMATCHED_RESULT_FORMAT_ERROR,
                                                    round_id: "444-f",
                                                    person_name: res_ko.personName,
                                                    expected_format: "Average of 5",
                                                    format: "Mean of 3")
      end
      validator_args.each do |arg|
        irv = IRV.new.validate(**arg)
        expect(irv.errors).to match_array(errs[arg[:model].to_s])
        expect(irv.warnings).to be_empty
      end
    end

    it "triggers several warnings about results" do
      # Triggers MBF_RESULT_OVER_TIME_LIMIT_WARNING
      # Triggers RESULT_AFTER_DNS_WARNING
      # Triggers SIMILAR_RESULTS_WARNING
      # Triggers SUSPICIOUS_DNF_WARNING

      expected_warnings = {
        "Result" => [],
        "InboxResult" => [],
      }

      FactoryBot.create(:round, competition: competition2, event_id: "222")
      FactoryBot.create(:round, competition: competition1, event_id: "333mbf", format_id: "3")
      tl = TimeLimit.new(centiseconds: 2.minutes.in_centiseconds, cumulative_round_ids: ["333bf-r1"])
      FactoryBot.create(:round, competition: competition1, event_id: "333bf",
                                format_id: "3", time_limit: tl)
      [Result, InboxResult].each do |model|
        warns = []
        result_kind = model.model_name.singular.to_sym
        res_mbf = FactoryBot.create(result_kind, :mbf, competition: competition1)
        # 8 points in 60:02 (ie: reached the time limit and got +2)
        res_mbf.update(value2: 910_360_200)
        warns << RV::ValidationWarning.new(:results, competition1.id,
                                           IRV::MBF_RESULT_OVER_TIME_LIMIT_WARNING,
                                           round_id: "333mbf-f",
                                           person_name: res_mbf.personName,
                                           result: res_mbf.solve_times[1].clock_format)

        res22 = FactoryBot.create(result_kind, competition: competition2, eventId: "222")
        res22.update(value4: -2)
        warns << RV::ValidationWarning.new(:results, competition2.id,
                                           IRV::RESULT_AFTER_DNS_WARNING,
                                           round_id: "222-f",
                                           person_name: res22.personName)

        # This creates the same result row for a different person as res22, expect for the DNS.
        res_sim1 = FactoryBot.create(result_kind, competition: competition2, eventId: "222")
        warns << RV::ValidationWarning.new(:results, competition2.id,
                                           IRV::SIMILAR_RESULTS_WARNING,
                                           round_id: "222-f",
                                           person_name: res_sim1.personName,
                                           similar_person_name: res22.personName)

        # We create a result with attempts #1 and #3 which are DNF.
        # Attempt 2 is suspiscious because the time is 1:40.00, and the competitor
        # already has one DNF which counts towards the cumulative time limit of 2:00.00.
        res_bf = FactoryBot.create(result_kind, :blind_dnf_mo3, competition: competition1, best: 100_00, value1: -1)

        warns << RV::ValidationWarning.new(:results, competition1.id,
                                           IRV::SUSPICIOUS_DNF_WARNING,
                                           round_ids: "333bf-f",
                                           person_name: res_bf.personName)

        expected_warnings[model.to_s] = warns
      end
      validator_args.each do |arg|
        irv = IRV.new.validate(**arg)
        expect(irv.errors).to be_empty
        expect(irv.warnings).to match_array(expected_warnings[arg[:model].to_s])
      end
    end
  end
end

def person_for_result(result)
  result.instance_of?(Result) ? Person.find_by(wca_id: result.personId) : InboxPerson.find_by(id: result.personId)
end
