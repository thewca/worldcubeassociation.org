# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
ACV = RV::AdvancementConditionsValidator

# TODO: Refactor these tests to be more atomic, and make better use of RSpec conventions
# Once refactor is complete, refactor advancement_conditions_validator
RSpec.describe ResultsValidators::AdvancementConditionsValidator do
  context "on InboxResult and Result" do
    let!(:competition1) { create(:competition, starts: Date.new(2010, 3, 1), event_ids: ["333oh"]) }
    let!(:competition2) { create(:competition, :past, event_ids: ["222"]) }
    let!(:competition3) { create(:competition, :past, event_ids: ["333"]) }

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

    it "doesn't complain when it's fine" do
      round_333oh_1, round_333oh_2, round_333oh_3, round_333oh_f = (1..4).map { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 4, number: i) }
      round_222_1, round_222_f = (1..2).map { |i| create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: i) }
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_list(result_kind, 100, competition: competition1, event_id: "333oh", round_type_id: "1", round: round_333oh_1)
        results += build_list(result_kind, 16, competition: competition1, event_id: "333oh", round_type_id: "2", round: round_333oh_2)
        results += build_list(result_kind, 8, competition: competition1, event_id: "333oh", round_type_id: "3", round: round_333oh_3)
        results += build_list(result_kind, 7, competition: competition1, event_id: "333oh", round_type_id: "f", round: round_333oh_f)
        results += build_list(result_kind, 8, competition: competition2, event_id: "222", round_type_id: "1", round: round_222_1)
        results += build_list(result_kind, 5, competition: competition2, event_id: "222", round_type_id: "f", round: round_222_f)
        model.import(results)
      end

      validator_args.each do |arg|
        acv = ACV.new.validate(**arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to be_empty
      end
    end

    it "ignores b-final" do
      round_333oh_b_final = create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 2, number: 0, old_type: "b")
      round_33_oh_1, round_33_oh_f = (1..2).map { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 2, number: i) }
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_list(result_kind, 100, competition: competition1, event_id: "333oh", round_type_id: "1", round: round_33_oh_1)
        results += build_list(result_kind, 8, competition: competition1, event_id: "333oh", round_type_id: "b", round: round_333oh_b_final)
        results += build_list(result_kind, 32, competition: competition1, event_id: "333oh", round_type_id: "f", round: round_33_oh_f)
        model.import(results, validate: false)
      end

      validator_args.each do |arg|
        acv = ACV.new.validate(**arg)
        # If it wouldn't ignore b-final, it would complain about competitors not
        # being eliminated.
        expect(acv.warnings).to be_empty
        expect(acv.errors).to be_empty
      end
    end

    # Triggers:
    # ROUND_9P1_ERROR
    # TOO_MANY_QUALIFIED_WARNING
    # NOT_ENOUGH_QUALIFIED_WARNING
    # COMPETED_NOT_QUALIFIED_ERROR
    it "validates round's advancement condition" do
      first_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 1)
      first_round.update(advancement_condition: AdvancementConditions::AttemptResultCondition.new(1700))
      second_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 2)

      first_round2 = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 1)
      first_round2.update(advancement_condition: AdvancementConditions::RankingCondition.new(4))
      second_round2 = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 2)

      expected_errors = []
      # We create 20 competitors:
      #   - for 2x2 this would actually let 17/20 people proceed, which breaks 9P1.
      #   - for second round we let a valid number of competitors proceed, which
      #   trigger the warning about letting less competitor proceed than expected.
      #   - for 3x3 we set a ranking condition arbitrarily low, and we let more
      #   competitors proceed than expected.
      (1..20).each do |i|
        fake_person = create(:person)
        value = i * 100
        create(:result, competition: competition2, event_id: "222", round_type_id: "1", person: fake_person, best: value, average: value, round: first_round)
        create(:result, competition: competition3, event_id: "333", round_type_id: "1", person: fake_person, best: value, average: value, round: first_round2)
        if i < 10
          create(:result, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person, best: value, average: value, round: second_round)
          create(:result, competition: competition3, event_id: "333", round_type_id: "f", person: fake_person, best: value, average: value, round: second_round2)
        end
        next unless i == 20

        # Create a single attempt result over the attempt result condition.
        create(:result, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person, best: 1800, average: 1800, round: second_round)
        expected_errors << RV::ValidationError.new(ACV::COMPETED_NOT_QUALIFIED_ERROR,
                                                   :rounds, competition2.id,
                                                   round_id: "222-f",
                                                   ids: "#{fake_person.name} (#{fake_person.wca_id})",
                                                   condition: first_round.advancement_condition.to_s(first_round))
      end
      expected_errors << RV::ValidationError.new(ACV::ROUND_9P1_ERROR,
                                                 :rounds, competition2.id,
                                                 round_id: "222-f",
                                                 condition: first_round.advancement_condition.to_s(first_round))
      expected_warnings = [
        RV::ValidationWarning.new(ACV::NOT_ENOUGH_QUALIFIED_WARNING,
                                  :rounds, competition2.id,
                                  round_id: "222-f", expected: 16, actual: 10),
        RV::ValidationWarning.new(ACV::TOO_MANY_QUALIFIED_WARNING,
                                  :rounds, competition3.id,
                                  round_id: "333-f", actual: 9, expected: 4,
                                  condition: first_round2.advancement_condition.to_s(first_round2)),
      ]
      acv = ACV.new.validate(competition_ids: [competition2.id, competition3.id], model: Result)
      expect(acv.warnings).to match_array(expected_warnings)
      expect(acv.errors).to match_array(expected_errors)
    end

    context 'competed_not_qualified' do
      let(:first_round) { create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 1) }
      let(:second_round) { create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 2) }

      before do
        # This creates 8 competitors (to not trigger 9m3), only 1 of whom has a result in the second round
        (1..8).each do |i|
          value = i * 100
          first_round_inbox_result = create(
            :inbox_result, competition: competition3, event_id: "333", round_type_id: "1", best: value, average: value, round: first_round
          )

          next unless i == 1

          @finalist = first_round_inbox_result.inbox_person # Instance variable because we use it to check the exact error string
          create(
            :inbox_result,
            competition: competition3,
            event_id: "333",
            round_type_id: "f",
            best: value,
            average: value,
            round: second_round,
            person: @finalist,
          )
        end
      end

      # Previously a competitor without a WCA ID competing in a round which had a result-based advancement condition (eg, sub-20 AO5)
      # would cause this validator to think that _all_ competitors without WCA IDs had competed in that round, and trigger the
      # validator error for ALL competitors without WCA IDs who did not meet the qualification criterion, irrespective of whether they
      # _actually_ participated in the round
      it 'recognizes that WCA_ID: nil users are distinct' do
        # Only the first inbox_result created above will pass this
        first_round.update(advancement_condition: AdvancementConditions::AttemptResultCondition.new(150))

        acv = ACV.new.validate(competition_ids: [competition3.id], model: InboxResult)
        expect(acv.errors).to be_empty
      end

      it "triggers when user achieves a results in 2nd round they shouldn't have advanced to" do
        # Set an advancement condition that all inbox_results created above will fail
        first_round.update(advancement_condition: AdvancementConditions::AttemptResultCondition.new(99))

        acv = ACV.new.validate(competition_ids: [competition3.id], model: InboxResult)
        expect(acv.errors.length).to be(1)
        expect(acv.errors.first.instance_variable_get(:@id)).to eq(:competed_not_qualified_error)
      end

      it 'returns name, and WCA ID when available' do
        first_round.update(advancement_condition: AdvancementConditions::AttemptResultCondition.new(99))

        # Create a second round result for an existing person, so that we see both output formats
        inbox_result = create(
          :inbox_result, :for_existing_person, competition: competition3, event_id: "333", round_type_id: "1", best: 100, average: 100, round: first_round
        )
        person = inbox_result.inbox_person

        create(
          :inbox_result, competition: competition3, event_id: "333", round_type_id: "f", best: 100, average: 100, round: second_round, person: person
        )

        acv = ACV.new.validate(competition_ids: [competition3.id], model: InboxResult)
        expect(acv.errors.length).to be(1)
        expect(acv.errors.first.instance_variable_get(:@args)[:ids]).to eq("#{@finalist.name},#{person.name} (#{person.wca_id})")
      end
    end

    it "ignores incomplete results when computing qualified people" do
      first_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 1)
      first_round.update(advancement_condition: AdvancementConditions::PercentCondition.new(75))
      second_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 2)
      # This creates 20 results: 10 complete, 10 DNF. With 75% proceeding it used to report a
      # warning that 15 could have proceeded but only 10 did. Now we take into account
      # the number of valid results when emitting the warning.
      (1..20).each do |i|
        fake_person = create(:person)
        value = i > 10 ? -1 : i * 100
        create(:result, competition: competition2, event_id: "222", round_type_id: "1", person: fake_person, best: value, average: value, round: first_round)
        create(:result, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person, best: value, average: value, round: second_round) if i <= 10
      end

      acv = ACV.new.validate(competition_ids: [competition2], model: Result)
      expect(acv.warnings).to be_empty
      expect(acv.errors).to be_empty
    end

    # Triggers:
    # REGULATION_9M1_ERROR
    # REGULATION_9M2_ERROR
    # REGULATION_9M3_ERROR
    # REGULATION_9P1_ERROR
    # OLD_REGULATION_9P_ERROR
    it "complains when it should" do
      round_333oh_1, round_333oh_2, round_333oh_3, round_333oh_f = (1..4).map { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 4, number: i) }
      round_222_1, round_222_f = (1..2).map { |i| create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: i) }
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_list(result_kind, 99, competition: competition1, event_id: "333oh", round_type_id: "1", round: round_333oh_1)
        results += build_list(result_kind, 15, competition: competition1, event_id: "333oh", round_type_id: "2", round: round_333oh_2)
        results += build_list(result_kind, 7, competition: competition1, event_id: "333oh", round_type_id: "3", round: round_333oh_3)
        results += build_list(result_kind, 7, competition: competition1, event_id: "333oh", round_type_id: "f", round: round_333oh_f)
        results += build_list(result_kind, 8, competition: competition2, event_id: "222", round_type_id: "1", round: round_222_1)
        results += build_list(result_kind, 7, competition: competition2, event_id: "222", round_type_id: "f", round: round_222_f)
        model.import(results, validate: false)
      end
      expected_errors = [
        RV::ValidationError.new(ACV::REGULATION_9M1_ERROR,
                                :rounds, competition1.id,
                                round_id: "333oh-1"),
        RV::ValidationError.new(ACV::REGULATION_9M2_ERROR,
                                :rounds, competition1.id,
                                round_id: "333oh-2"),
        RV::ValidationError.new(ACV::REGULATION_9M3_ERROR,
                                :rounds, competition1.id,
                                round_id: "333oh-3"),
        RV::ValidationError.new(ACV::OLD_REGULATION_9P_ERROR,
                                :rounds, competition1.id,
                                round_id: "333oh-f"),
        RV::ValidationError.new(ACV::REGULATION_9P1_ERROR,
                                :rounds, competition2.id,
                                round_id: "222-f"),
      ]

      validator_args.each do |arg|
        acv = ACV.new.validate(**arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to match_array(expected_errors)
      end
    end
  end
end
