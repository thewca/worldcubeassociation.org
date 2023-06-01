# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsValidators::PositionsValidator do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, :past, event_ids: ["333oh"]) }
    let!(:competition2) { FactoryBot.create(:competition, :past, event_ids: ["222"]) }

    # The idea behind this variable is the following: the validator can be applied
    # on either a particular model for given competition ids, or on a set of results.
    # We simply want to check it has the expected behavior on all the possible cases.
    let(:validator_args) {
      [InboxResult, Result].flat_map { |model|
        [
          { competition_ids: [competition1.id, competition2.id], model: model },
          { results: model.where(competition_id: [competition1.id, competition2.id]), model: model },
        ]
      }
    }

    context "basic results" do
      let!(:results) {
        {
          "Result" => [
            create_results(competition1, 5, "333oh"),
            create_results(competition2, 5, "222"),
          ],
          "InboxResult" => [
            create_results(competition1, 5, "333oh", kind: :inbox_result),
            create_results(competition2, 5, "222", kind: :inbox_result),
          ],
        }
      }
      it "validates results correctly ordered on given competitions" do
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(**arg)
          expect(pv.has_errors?).to eq false
        end
      end

      it "invalidates messed up positions in given competitions" do
        expected_errors = {}
        [InboxResult, Result].each do |model|
          table_results = results[model.to_s]
          person_name_1 = table_results[0].first.person_name
          person_name_2 = table_results[1].last.person_name
          expected_errors[model.to_s] = [
            create_result_error(competition1.id, "333oh-f", person_name_1, 1, 2),
            create_result_error(competition2.id, "222-f", person_name_2, 5, 7),
          ]
          model.where(pos: 1, event_id: "333oh").first.update!(pos: 2)
          model.where(pos: 5, event_id: "222").first.update!(pos: 7)
        end
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(**arg)
          expect(pv.errors).to match_array(expected_errors[arg[:model].to_s])
        end
      end

      it "fixes messed up positions in given competitions when requested to" do
        expected_infos = {}
        [InboxResult, Result].each do |model|
          table_results = results[model.to_s]
          person_name_1 = table_results[0].first.person_name
          person_name_2 = table_results[1].last.person_name
          expected_infos[model.to_s] = [
            ResultsValidators::ValidationInfo.new(:results, competition1.id,
                                                  ResultsValidators::PositionsValidator::POSITION_FIXED_INFO,
                                                  round_id: "333oh-f",
                                                  person_name: person_name_1,
                                                  expected_pos: 1,
                                                  pos: 2),
            ResultsValidators::ValidationInfo.new(:results, competition2.id,
                                                  ResultsValidators::PositionsValidator::POSITION_FIXED_INFO,
                                                  round_id: "222-f",
                                                  person_name: person_name_2,
                                                  expected_pos: 5,
                                                  pos: 7),
          ]
        end
        validator_args.each do |arg|
          # This is a bit tricky: we have to create the wrong results here,
          # because we run the validation twice on each model (once by loading
          # the results through the competition id, once by loading directly
          # the results). Therefore results are fixed on the first validation
          # and no fix is reported on the subsequent one.
          arg[:model].where(pos: 1, event_id: "333oh").update(pos: 2)
          arg[:model].where(pos: 5, event_id: "222").update(pos: 7)
          pv = ResultsValidators::PositionsValidator.new(apply_fixes: true).validate(**arg)
          expect(pv.has_errors?).to eq false
          expect(pv.infos).to match_array(expected_infos[arg[:model].to_s])
        end
      end
    end

    context "tied results" do
      it "validates correctly tied results" do
        create_correct_tied_results(competition1, "333oh")
        create_correct_tied_results(competition1, "333oh", kind: :inbox_result)
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(**arg)
          expect(pv.has_errors?).to eq false
        end
      end
      it "invalidates incorrectly tied results" do
        results1 = create_incorrect_tied_results(competition1, "222")
        results2 = create_incorrect_tied_results(competition1, "222", kind: :inbox_result)
        expected_errors = {
          "Result" => create_result_error(competition1.id, "222-f", results1[1].person_name, 1, 2),
          "InboxResult" => create_result_error(competition1.id, "222-f", results2[1].person_name, 1, 2),
        }
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(**arg)
          expect(pv.errors).to match_array(expected_errors[arg[:model].to_s])
        end
      end
    end

    context "bo3 results with a mean" do
      # NOTE: I assume the previous sets of tests validates that the validator works
      # on either Result/InboxResult and on any given results input.
      # The next few tests are very specific cases and are made against only real results on a given competition.
      it "validates correctly tied results" do
        # In a BoX format, results with the same best should have the same position,
        # even if one has a mean.
        FactoryBot.create(:result, :blind_dnf_mo3, competition: competition1, pos: 1, best: 1000)
        FactoryBot.create(:result, :blind_mo3, competition: competition1, pos: 1, best: 1000)
        FactoryBot.create(:result, :blind_mo3, competition: competition1, pos: 3, best: 2000)
        pv = ResultsValidators::PositionsValidator.new.validate(competition_ids: competition1.id, model: Result)
        expect(pv.has_errors?).to eq false
      end

      it "invalidates incorrectly ordered results" do
        # In a BoX format, results should be ordered by best, not mean.
        r1 = FactoryBot.create(:result, :blind_mo3, competition: competition1, pos: 1, best: 2000)
        r2 = FactoryBot.create(:result, :blind_dnf_mo3, competition: competition1, pos: 2, best: 1000)
        expected_errors = [
          create_result_error(competition1.id, "333bf-f", r1.person_name, 2, 1),
          create_result_error(competition1.id, "333bf-f", r2.person_name, 1, 2),
        ]

        pv = ResultsValidators::PositionsValidator.new.validate(competition_ids: competition1.id, model: Result)
        expect(pv.errors).to match_array(expected_errors)
      end
    end
  end
end

def create_results(competition, number, event_id, kind: :result)
  results = []
  1.upto(number) do |i|
    # By default the factory creates a predefined best/average, to have increasing
    # time we need to provide some arbitrary times increasing with the position.
    results << FactoryBot.create(kind, competition: competition, pos: i, best: i*1000, average: i*2000, event_id: event_id)
  end
  results
end

def create_correct_tied_results(competition, event_id, kind: :result)
  [
    FactoryBot.create(kind, competition: competition, pos: 1, best: 1000, average: 2000, event_id: event_id),
    FactoryBot.create(kind, competition: competition, pos: 1, best: 1000, average: 2000, event_id: event_id),
    FactoryBot.create(kind, competition: competition, pos: 3, best: 2000, average: 2000, event_id: event_id),
  ]
end

def create_incorrect_tied_results(competition, event_id, kind: :result)
  [
    FactoryBot.create(kind, competition: competition, pos: 1, best: 1000, average: 2000, event_id: event_id),
    FactoryBot.create(kind, competition: competition, pos: 2, best: 1000, average: 2000, event_id: event_id),
    FactoryBot.create(kind, competition: competition, pos: 3, best: 2000, average: 2000, event_id: event_id),
  ]
end

def create_result_error(competition_id, round_id, name, expected_pos, actual_pos)
  ResultsValidators::ValidationError.new(:results, competition_id, ResultsValidators::PositionsValidator::WRONG_POSITION_IN_RESULTS_ERROR, round_id: round_id, person_name: name, expected_pos: expected_pos, pos: actual_pos)
end
