# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
ACV = RV::AdvancementConditionsValidator

# TODO: Refactor these tests to be more atomic, and make better use of RSpec conventions
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

    def people_pool(model, competition, count)
      if model == Result
        create_list(:person, count)
      else
        create_list(:inbox_person, count, competition_id: competition.id)
      end
    end

    def build_round_results(model, people, competition, round, event_id:, round_type_id:)
      result_kind = model.model_name.singular.to_sym
      people.map do |person|
        build(result_kind, competition: competition, event_id: event_id, round_type_id: round_type_id, round: round, person: person)
      end
    end

    it "doesn't complain when it's fine" do
      round_333oh_1, round_333oh_2, round_333oh_3, round_333oh_f = (1..4).map { |i| create(:round, competition: competition1, event_id: "333oh", total_number_of_rounds: 4, number: i) }
      round_333oh_2.update!(participation_source: round_333oh_1)
      round_333oh_3.update!(participation_source: round_333oh_2)
      round_333oh_f.update!(participation_source: round_333oh_3)
      round_222_1, round_222_f = (1..2).map { |i| create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: i) }
      round_222_f.update!(participation_source: round_222_1)
      [Result, InboxResult].each do |model|
        people1 = people_pool(model, competition1, 100)
        people2 = people_pool(model, competition2, 8)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_round_results(model, people1, competition1, round_333oh_1, event_id: "333oh", round_type_id: "1")
        results += build_round_results(model, people1.first(16), competition1, round_333oh_2, event_id: "333oh", round_type_id: "2")
        results += build_round_results(model, people1.first(8), competition1, round_333oh_3, event_id: "333oh", round_type_id: "3")
        results += build_round_results(model, people1.first(7), competition1, round_333oh_f, event_id: "333oh", round_type_id: "f")
        results += build_round_results(model, people2, competition2, round_222_1, event_id: "222", round_type_id: "1")
        results += build_round_results(model, people2.first(5), competition2, round_222_f, event_id: "222", round_type_id: "f")
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
      round_33_oh_f.update!(participation_source: round_33_oh_1)
      [Result, InboxResult].each do |model|
        people = people_pool(model, competition1, 100)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_round_results(model, people, competition1, round_33_oh_1, event_id: "333oh", round_type_id: "1")
        results += build_round_results(model, people.first(8), competition1, round_333oh_b_final, event_id: "333oh", round_type_id: "b")
        results += build_round_results(model, people.first(32), competition1, round_33_oh_f, event_id: "333oh", round_type_id: "f")
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
    # TOO_MANY_QUALIFIED_ERROR
    # NOT_ENOUGH_QUALIFIED_WARNING
    # COMPETED_NOT_QUALIFIED_ERROR
    it "validates round's participation condition" do
      first_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 1)
      second_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 2,
                                    participation_source: first_round,
                                    participation_condition: ResultConditions::ResultAchieved.new(scope: "average", value: 1700))

      first_round2 = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 1)
      second_round2 = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 2,
                                     participation_source: first_round2,
                                     participation_condition: ResultConditions::Ranking.new(scope: "average", value: 4))

      expected_errors = []
      # We create 20 competitors:
      #   - for 2x2 the "result achieved" condition would allow 16/20 people to
      #   proceed, which breaks 9P1. We let a valid number of competitors proceed,
      #   which triggers the warning about fewer competitors proceeding than expected.
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
                                                   condition: second_round.participation_condition.to_s(first_round))
      end
      expected_errors << RV::ValidationError.new(ACV::ROUND_9P1_ERROR,
                                                 :rounds, competition2.id,
                                                 round_id: "222-f",
                                                 condition: second_round.participation_condition.to_s(first_round))
      expected_errors << RV::ValidationError.new(ACV::TOO_MANY_QUALIFIED_ERROR,
                                                 :rounds, competition3.id,
                                                 round_id: "333-f", actual: 9, expected: 4,
                                                 condition: second_round2.participation_condition.to_s(first_round2))
      expected_warnings = [
        RV::ValidationWarning.new(ACV::NOT_ENOUGH_QUALIFIED_WARNING,
                                  :rounds, competition2.id,
                                  round_id: "222-f", expected: 16, actual: 10),
      ]
      acv = ACV.new.validate(competition_ids: [competition2.id, competition3.id], model: Result)
      expect(acv.warnings).to match_array(expected_warnings)
      expect(acv.errors).to match_array(expected_errors)
    end

    context 'competed_not_qualified' do
      let(:first_round) { create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 1) }
      let(:second_round) { create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 2, participation_source: first_round) }

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
        second_round.update(participation_condition: ResultConditions::ResultAchieved.new(scope: "average", value: 150))

        acv = ACV.new.validate(competition_ids: [competition3.id], model: InboxResult)
        expect(acv.errors).to be_empty
      end

      it "triggers when user achieves a results in 2nd round they shouldn't have advanced to" do
        # Set a participation condition that all inbox_results created above will fail
        second_round.update(participation_condition: ResultConditions::ResultAchieved.new(scope: "average", value: 99))

        acv = ACV.new.validate(competition_ids: [competition3.id], model: InboxResult)
        # Since nobody satisfies the condition, the round as a whole is also over-advanced
        error_ids = acv.errors.map { it.instance_variable_get(:@id) }
        expect(error_ids).to contain_exactly(:competed_not_qualified_error, :too_many_qualified_error)
      end

      it 'returns name, and WCA ID when available' do
        second_round.update(participation_condition: ResultConditions::ResultAchieved.new(scope: "average", value: 99))

        # Create a second round result for an existing person, so that we see both output formats
        inbox_result = create(
          :inbox_result, :for_existing_person, competition: competition3, event_id: "333", round_type_id: "1", best: 100, average: 100, round: first_round
        )
        person = inbox_result.inbox_person

        create(
          :inbox_result, competition: competition3, event_id: "333", round_type_id: "f", best: 100, average: 100, round: second_round, person: person
        )

        acv = ACV.new.validate(competition_ids: [competition3.id], model: InboxResult)
        competed_error = acv.errors.find { it.instance_variable_get(:@id) == :competed_not_qualified_error }
        expect(competed_error.instance_variable_get(:@args)[:ids]).to eq("#{@finalist.name},#{person.name} (#{person.wca_id})")
      end
    end

    it "ignores incomplete results when computing qualified people" do
      first_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 1)
      second_round = create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: 2,
                                    participation_source: first_round,
                                    participation_condition: ResultConditions::Percent.new(scope: "average", value: 75))
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

    it "flags competitors advancing without a valid result, regardless of any condition" do
      first_round = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 1)
      second_round = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 2, number: 2, participation_source: first_round)

      # 12 competitors in round 1, the last of which DNFs all their attempts.
      people = (1..12).map do |i|
        fake_person = create(:person)
        value = i == 12 ? -1 : i * 100
        create(:result, competition: competition3, event_id: "333", round_type_id: "1", person: fake_person, best: value, average: value, round: first_round)
        fake_person
      end

      # 9 competitors in the final (exactly 75% of 12, so no 9P1 issues): 7 valid
      # qualifiers, the all-DNF competitor, and one person without any round 1 result.
      finalists = people.first(7) + [people.last, create(:person)]
      finalists.each_with_index do |fake_person, i|
        value = (i + 1) * 100
        create(:result, competition: competition3, event_id: "333", round_type_id: "f", person: fake_person, best: value, average: value, round: second_round)
      end

      acv = ACV.new.validate(competition_ids: [competition3.id], model: Result)
      expect(acv.warnings).to be_empty
      expect(acv.errors.length).to be(1)
      expect(acv.errors.first.instance_variable_get(:@id)).to eq(:advanced_without_valid_result_error)
      flagged_ids = acv.errors.first.instance_variable_get(:@args)[:ids]
      expect(flagged_ids).to include(people.last.name)
      expect(flagged_ids).to include(finalists.last.name)
    end

    it "checks participation conditions of linked (dual) destination rounds" do
      # Rounds 2 and 3 form a dual round (9v5): they are run as a single combined round,
      # and both carry the participation condition for entry into the pair. One competitor
      # too many in either of the linked rounds must be flagged.
      linked_round = create(:linked_round)
      first_round = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 3, number: 1)
      condition = ResultConditions::Ranking.new(scope: "average", value: 4)
      round_333_2 = create(:round, competition: competition3, event_id: "333", linked_round: linked_round, total_number_of_rounds: 3, number: 2,
                                   participation_source: first_round, participation_condition: condition)
      round_333_3 = create(:round, competition: competition3, event_id: "333", linked_round: linked_round, total_number_of_rounds: 3, number: 3,
                                   participation_source: first_round, participation_condition: condition)

      people = (1..20).map do |i|
        fake_person = create(:person)
        create(:result, competition: competition3, event_id: "333", round_type_id: "1", person: fake_person, best: i * 100, average: i * 100, round: first_round)
        fake_person
      end

      # 4 people are allowed into the pair, but 5 distinct people show up in the second linked round.
      people.first(4).each_with_index do |fake_person, i|
        create(:result, competition: competition3, event_id: "333", round_type_id: "2", person: fake_person, best: (i + 1) * 100, average: (i + 1) * 100, round: round_333_2)
      end
      people.first(5).each_with_index do |fake_person, i|
        create(:result, competition: competition3, event_id: "333", round_type_id: "f", person: fake_person, best: (i + 1) * 100, average: (i + 1) * 100, round: round_333_3)
      end

      expected_errors = [
        RV::ValidationError.new(ACV::TOO_MANY_QUALIFIED_ERROR,
                                :rounds, competition3.id,
                                round_id: "333-f", actual: 5, expected: 4,
                                condition: round_333_3.participation_condition.to_s(first_round)),
      ]

      acv = ACV.new.validate(competition_ids: [competition3.id], model: Result)
      expect(acv.warnings).to be_empty
      expect(acv.errors).to match_array(expected_errors)
    end

    it "merges linked (dual) rounds when checking advancement to the next round" do
      # Dual round (9v5): rounds 1 and 2 are run as a single combined round, then round 3 follows.
      # 60 competitors in round 1 and 40 (different) in round 2 => 100 combined. 70 advance to
      # round 3. Checked against round 2 alone (40 people) this would falsely trip 9P1
      # (max 30 may advance); checked against the merged 100 it is fine (max 75).
      linked_round = create(:linked_round)
      round_333_1 = create(:round, competition: competition3, event_id: "333", linked_round: linked_round, total_number_of_rounds: 3, number: 1)
      round_333_2 = create(:round, competition: competition3, event_id: "333", linked_round: linked_round, total_number_of_rounds: 3, number: 2)
      round_333_3 = create(:round, competition: competition3, event_id: "333", total_number_of_rounds: 3, number: 3, participation_source: linked_round)

      people = people_pool(Result, competition3, 100)
      results = []
      results += people.first(60).map { build(:result, competition: competition3, event_id: "333", round_type_id: "1", person: it, round: round_333_1) }
      results += people.last(40).map { build(:result, competition: competition3, event_id: "333", round_type_id: "2", person: it, round: round_333_2) }
      results += people.first(70).map { build(:result, competition: competition3, event_id: "333", round_type_id: "f", person: it, round: round_333_3) }
      Result.import(results, validate: false)

      acv = ACV.new.validate(competition_ids: [competition3.id], model: Result)
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
      round_333oh_2.update!(participation_source: round_333oh_1)
      round_333oh_3.update!(participation_source: round_333oh_2)
      round_333oh_f.update!(participation_source: round_333oh_3)
      round_222_1, round_222_f = (1..2).map { |i| create(:round, competition: competition2, event_id: "222", total_number_of_rounds: 2, number: i) }
      round_222_f.update!(participation_source: round_222_1)
      [Result, InboxResult].each do |model|
        people1 = people_pool(model, competition1, 99)
        people2 = people_pool(model, competition2, 8)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += build_round_results(model, people1, competition1, round_333oh_1, event_id: "333oh", round_type_id: "1")
        results += build_round_results(model, people1.first(15), competition1, round_333oh_2, event_id: "333oh", round_type_id: "2")
        results += build_round_results(model, people1.first(7), competition1, round_333oh_3, event_id: "333oh", round_type_id: "3")
        results += build_round_results(model, people1.first(7), competition1, round_333oh_f, event_id: "333oh", round_type_id: "f")
        results += build_round_results(model, people2, competition2, round_222_1, event_id: "222", round_type_id: "1")
        results += build_round_results(model, people2.first(7), competition2, round_222_f, event_id: "222", round_type_id: "f")
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
