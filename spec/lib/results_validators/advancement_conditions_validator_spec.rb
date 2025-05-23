# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
ACV = RV::AdvancementConditionsValidator

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
      (1..4).each { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 4, number: i) }
      (1..2).each { |i| create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: i) }
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Using a single fake person for all the results for better performance.
        fake_person = build_person(result_kind, competition1)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_list(result_kind, 100, competition: competition1, event_id: "333oh", round_type_id: "1", person: fake_person)
        results += build_list(result_kind, 16, competition: competition1, event_id: "333oh", round_type_id: "2", person: fake_person)
        results += build_list(result_kind, 8, competition: competition1, event_id: "333oh", round_type_id: "3", person: fake_person)
        results += build_list(result_kind, 7, competition: competition1, event_id: "333oh", round_type_id: "f", person: fake_person)
        results += build_list(result_kind, 8, competition: competition2, event_id: "222", round_type_id: "1", person: fake_person)
        results += build_list(result_kind, 5, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person)
        model.import(results)
      end

      validator_args.each do |arg|
        acv = ACV.new.validate(**arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to be_empty
      end
    end

    it "ignores b-final" do
      create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 2, number: 0, old_type: "b")
      (1..2).each { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 2, number: i) }
      # Using a single fake person for all the results for better performance.
      fake_person = build_person(:result, competition1)
      # Collecting all the results and using bulk import for better performance.
      results = []
      results += build_list(:result, 100, competition: competition1, event_id: "333oh", round_type_id: "1", person: fake_person)
      results += build_list(:result, 8, competition: competition1, event_id: "333oh", round_type_id: "b", person: fake_person)
      results += build_list(:result, 32, competition: competition1, event_id: "333oh", round_type_id: "f", person: fake_person)
      Result.import(results, validate: false)

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
      create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 2)

      first_round2 = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 1)
      first_round2.update(advancement_condition: AdvancementConditions::RankingCondition.new(4))
      create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 2)

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
        create(:result, competition: competition2, event_id: "222", round_type_id: "1", person: fake_person, best: value, average: value)
        create(:result, competition: competition3, event_id: "333", round_type_id: "1", person: fake_person, best: value, average: value)
        if i < 10
          create(:result, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person, best: value, average: value)
          create(:result, competition: competition3, event_id: "333", round_type_id: "f", person: fake_person, best: value, average: value)
        end
        next unless i == 20

        # Create a single attempt result over the attempt result condition.
        create(:result, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person, best: 1800, average: 1800)
        expected_errors << RV::ValidationError.new(ACV::COMPETED_NOT_QUALIFIED_ERROR,
                                                   :rounds, competition2.id,
                                                   round_id: "222-f",
                                                   ids: fake_person.wca_id,
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

    it "ignores incomplete results when computing qualified people" do
      first_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 1)
      first_round.update(advancement_condition: AdvancementConditions::PercentCondition.new(75))
      create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 2)
      # This creates 20 results: 10 complete, 10 DNF. With 75% proceeding it used to report a
      # warning that 15 could have proceeded but only 10 did. Now we take into account
      # the number of valid results when emitting the warning.
      (1..20).each do |i|
        fake_person = create(:person)
        value = i > 10 ? -1 : i * 100
        create(:result, competition: competition2, event_id: "222", round_type_id: "1", person: fake_person, best: value, average: value)
        create(:result, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person, best: value, average: value) if i <= 10
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
      (1..4).each { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 4, number: i) }
      (1..2).each { |i| create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: i) }
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Using a single fake person for all the results for better performance.
        fake_person = build_person(result_kind, competition1)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_list(result_kind, 99, competition: competition1, event_id: "333oh", round_type_id: "1", person: fake_person)
        results += build_list(result_kind, 15, competition: competition1, event_id: "333oh", round_type_id: "2", person: fake_person)
        results += build_list(result_kind, 7, competition: competition1, event_id: "333oh", round_type_id: "3", person: fake_person)
        results += build_list(result_kind, 7, competition: competition1, event_id: "333oh", round_type_id: "f", person: fake_person)
        results += build_list(result_kind, 8, competition: competition2, event_id: "222", round_type_id: "1", person: fake_person)
        results += build_list(result_kind, 7, competition: competition2, event_id: "222", round_type_id: "f", person: fake_person)
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

    it "does not explode when there are results for non-existent rounds" do
      create(:round, competition: competition1, event_id: "333bf", format_id: "3", total_number_of_rounds: 1, number: 1)

      fake_person = build_person(:result, competition1)

      existent_result = build(:result, competition: competition1, event_id: "333bf", format_id: "3", round_type_id: "f", person: fake_person)
      nonexistent_result = build(:result, competition: competition1, event_id: "333bf", format_id: "3", round_type_id: "1", person: fake_person, skip_round_creation: true)

      Result.import([existent_result, nonexistent_result], validate: false)

      acv = ACV.new.validate(competition_ids: [competition1], model: Result)
      expect(acv.errors).to include(RV::ValidationError.new(ACV::ROUND_NOT_FOUND_ERROR,
                                                            :rounds, competition1.id,
                                                            round_id: "333bf-1"))
    end
  end

  private

    def build_person(result_kind, competition)
      if result_kind == :result
        build(:person)
      else
        build(:inbox_person, competition_id: competition.id)
      end
    end
end
