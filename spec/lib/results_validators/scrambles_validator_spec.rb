# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
SV = RV::ScramblesValidator

RSpec.describe SV do
  context "on InboxResult and Result" do
    let!(:competition1) { create(:competition, :past, event_ids: %w[333oh 333mbf]) }
    let!(:competition2) { create(:competition, :past, event_ids: %w[222 333bf 333mbf]) }
    let!(:competition3) { create(:competition, :past, event_ids: ["333fm"]) }

    # The idea behind this variable is the following: the validator can be applied
    # on either a particular model for given competition ids, or on a set of results.
    # We simply want to check it has the expected behavior on all the possible cases.
    let(:validator_args) do
      [InboxResult, Result].flat_map do |model|
        [
          { competition_ids: [competition1.id, competition2.id, competition3.id], model: model },
          { results: model.where(competition_id: [competition1.id, competition2.id, competition3.id]), model: model },
        ]
      end
    end

    context "Scramble" do
      let(:round_333oh) { create(:round, competition: competition1, event_id: "333oh") }
      let(:round_222) { create(:round, competition: competition2, event_id: "222") }
      let(:round_333bf) { create(:round, competition: competition2, event_id: "333bf", format_id: "3") }

      # Triggers:
      # MISSING_SCRAMBLES_FOR_ROUND_ERROR
      # MISSING_SCRAMBLES_FOR_COMPETITION_ERROR
      # MISSING_SCRAMBLES_FOR_GROUP_ERROR
      it "matches Result" do
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create(result_kind, competition: competition1, event_id: "333oh", round: round_333oh)
          create(result_kind, competition: competition2, event_id: "222", round: round_222)
          create(result_kind, :blind_mo3, competition: competition2, round: round_333bf)
        end

        expected_errors = [
          RV::ValidationError.new(SV::MISSING_SCRAMBLES_FOR_ROUND_ERROR,
                                  :scrambles, competition2.id,
                                  round_id: "333bf-f"),
        ]

        # Scrambles are shared between InboxResult and Result
        create_scramble_set(5, competition: competition1, round: round_333oh, event_id: "333oh")
        create_scramble_set(5, competition: competition2, round: round_222, event_id: "222")

        validator_args.each do |arg|
          sv = SV.new.validate(**arg)
          expect(sv.warnings).to be_empty
          expect(sv.errors).to match_array(expected_errors)
        end
      end

      it "matches the competition's data" do
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create(result_kind, competition: competition1, event_id: "333oh", round: round_333oh)
          create(result_kind, :blind_mo3, competition: competition2, round: round_333bf)
        end

        create_scramble_set(2, competition: competition2, round: round_333bf, event_id: "333bf")

        expected_errors = [
          RV::ValidationError.new(SV::MISSING_SCRAMBLES_FOR_COMPETITION_ERROR,
                                  :scrambles, competition1.id,
                                  competition_id: competition1.id),
          RV::ValidationError.new(SV::MISSING_SCRAMBLES_FOR_GROUP_ERROR,
                                  :scrambles, competition2.id,
                                  round_id: "333bf-f", group_id: "A",
                                  actual: 2, expected: 3),
        ]

        validator_args.each do |arg|
          sv = SV.new.validate(**arg)
          expect(sv.warnings).to be_empty
          expect(sv.errors).to match_array(expected_errors)
        end
      end

      it "correctly (in)validates scramble sets not matching" do
        round_333oh = create(:round, competition: competition1, event_id: "333oh", scramble_set_count: 2)

        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create(result_kind, competition: competition1, event_id: "333oh", round: round_333oh)
        end

        # Create three groups of scrambles:
        create_scramble_set(5, competition: competition1, round: round_333oh, event_id: "333oh", group_id: "A")
        create_scramble_set(5, competition: competition1, round: round_333oh, event_id: "333oh", group_id: "B")
        create_scramble_set(5, competition: competition1, round: round_333oh, event_id: "333oh", group_id: "C")

        expected_errors = [
          RV::ValidationError.new(SV::WRONG_NUMBER_OF_SCRAMBLE_SETS_ERROR,
                                  :scrambles, competition1.id,
                                  round_id: "333oh-f"),
        ]

        validator_args.each do |arg|
          sv = SV.new.validate(**arg)
          expect(sv.errors).to match_array(expected_errors)
          expect(sv.warnings).to be_empty
        end
      end

      it "correctly (in)validates multiple groups for 333fm" do
        round = create(:round, competition: competition3, event_id: "333fm", format_id: "m", scramble_set_count: 2)

        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create(result_kind, :fm, competition: competition3, round: round)
        end

        # Create two groups in fmc:
        create_scramble_set(3, competition: competition3, round: round, event_id: "333fm", group_id: "A")
        create_scramble_set(3, competition: competition3, round: round, event_id: "333fm", group_id: "B")

        expected_warnings = [
          RV::ValidationWarning.new(SV::MULTIPLE_FMC_GROUPS_WARNING,
                                    :scrambles, competition3.id,
                                    round_id: "333fm-f"),
        ]

        validator_args.each do |arg|
          sv = SV.new.validate(**arg)
          expect(sv.warnings).to match_array(expected_warnings)
          expect(sv.errors).to be_empty
        end
      end

      it "correctly (in)validates multiple groups for 333mbf" do
        round_333mbf_1 = create(:round, competition: competition1, event_id: "333mbf", format_id: "3", scramble_set_count: 2)
        round_333mbf_2 = create(:round, competition: competition2, event_id: "333mbf", format_id: "3", scramble_set_count: 2)

        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create(result_kind, :mbf, competition: competition1, round: round_333mbf_1)
          create(result_kind, :mbf, competition: competition2, round: round_333mbf_2)
        end

        # Create two groups in multi: for attempt 1 they did 2 groups,
        # for the others they just did one.
        create_scramble_set(3, competition: competition1, round: round_333mbf_1, event_id: "333mbf", group_id: "A")
        create_scramble_set(1, competition: competition1, round: round_333mbf_1, event_id: "333mbf", group_id: "B")

        # Now for competition2, both groups have only two scrambles but the format
        # is bo3, so the round is missing scrambles.
        create_scramble_set(2, competition: competition2, round: round_333mbf_2, event_id: "333mbf", group_id: "A")
        create_scramble_set(2, competition: competition2, round: round_333mbf_2, event_id: "333mbf", group_id: "B")

        expected_errors = [
          RV::ValidationError.new(SV::MISSING_SCRAMBLES_FOR_MULTI_ERROR,
                                  :scrambles, competition2.id,
                                  round_id: "333mbf-f"),
        ]

        validator_args.each do |arg|
          sv = SV.new.validate(**arg)
          expect(sv.warnings).to be_empty
          expect(sv.errors).to match_array(expected_errors)
        end
      end
    end
  end

  def create_scramble_set(n, **)
    1.upto(n) do |i|
      create(:scramble, scramble_num: i, **)
    end
  end
end
