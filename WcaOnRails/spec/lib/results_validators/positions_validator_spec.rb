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
          { results: model.sorted_for_competitions([competition1.id, competition2.id]), model: model },
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
          pv = ResultsValidators::PositionsValidator.new.validate(arg)
          expect(pv.has_errors?).to eq false
        end
      end

      it "invalidates messed up positions in given competitions" do
        expected_errors = {}
        [InboxResult, Result].each do |model|
          table_results = results[model.to_s]
          personName1 = name_for_result(table_results[0].first)
          personName2 = name_for_result(table_results[1].last)
          expected_errors[model.to_s] = [
            create_result_error(competition1.id, "333oh-f", personName1, 1, 2),
            create_result_error(competition2.id, "222-f", personName2, 5, 7),
          ]
          model.where(pos: 1, eventId: "333oh").update(pos: 2)
          model.where(pos: 5, eventId: "222").update(pos: 7)
        end
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(arg)
          expect(pv.errors).to match_array(expected_errors[arg[:model].to_s])
        end
      end
    end
    context "tied results" do
      it "validates correctly tied results" do
        create_correct_tied_results(competition1, "333oh")
        create_correct_tied_results(competition1, "333oh", kind: :inbox_result)
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(arg)
          expect(pv.has_errors?).to eq false
        end
      end
      it "invalidates incorrectly tied results" do
        results1 = create_incorrect_tied_results(competition1, "222")
        results2 = create_incorrect_tied_results(competition1, "222", kind: :inbox_result)
        expected_errors = {
          "Result" => create_result_error(competition1.id, "222-f", name_for_result(results1[1]), 1, 2),
          "InboxResult" => create_result_error(competition1.id, "222-f", name_for_result(results2[1]), 1, 2),
        }
        validator_args.each do |arg|
          pv = ResultsValidators::PositionsValidator.new.validate(arg)
          expect(pv.errors).to match_array(expected_errors[arg[:model].to_s])
        end
      end
    end
  end
end

def create_results(competition, number, event_id, kind: :result)
  results = []
  1.upto(number) do |i|
    # By default the factory creates a predefined best/average, to have increasing
    # time we need to provide some arbitrary times increasing with the position.
    results << FactoryBot.create(kind, competition: competition, pos: i, best: i*1000, average: i*2000, eventId: event_id)
  end
  results
end

def create_correct_tied_results(competition, event_id, kind: :result)
  [
    FactoryBot.create(kind, competition: competition, pos: 1, best: 1000, average: 2000, eventId: event_id),
    FactoryBot.create(kind, competition: competition, pos: 1, best: 1000, average: 2000, eventId: event_id),
    FactoryBot.create(kind, competition: competition, pos: 3, best: 2000, average: 2000, eventId: event_id),
  ]
end

def create_incorrect_tied_results(competition, event_id, kind: :result)
  [
    FactoryBot.create(kind, competition: competition, pos: 1, best: 1000, average: 2000, eventId: event_id),
    FactoryBot.create(kind, competition: competition, pos: 2, best: 1000, average: 2000, eventId: event_id),
    FactoryBot.create(kind, competition: competition, pos: 3, best: 2000, average: 2000, eventId: event_id),
  ]
end

def create_result_error(competition_id, round_id, name, expected_pos, actual_pos)
  ResultsValidators::ValidationError.new(:results, competition_id, ResultsValidators::PositionsValidator::WRONG_POSITION_IN_RESULTS_ERROR, round_id: round_id, person_name: name, expected_pos: expected_pos, pos: actual_pos)
end

def name_for_result(result)
  result.respond_to?(:personName) ? result.personName : InboxPerson.where(id: result.personId).first.name
end
