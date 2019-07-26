# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
SV = RV::ScramblesValidator

RSpec.describe SV do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, :past, event_ids: ["333oh"]) }
    let!(:competition2) { FactoryBot.create(:competition, :past, event_ids: ["222", "333bf"]) }

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

    context "Scramble" do
      # Triggers:
      # MISSING_SCRAMBLES_FOR_ROUND_ERROR
      # MISSING_SCRAMBLES_FOR_COMPETITION_ERROR
      # UNEXPECTED_SCRAMBLES_FOR_ROUND_ERROR
      # MISSING_SCRAMBLES_FOR_GROUP_ERROR
      it "matches Result" do
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          FactoryBot.create(result_kind, competition: competition1, eventId: "333oh")
          FactoryBot.create(result_kind, competition: competition2, eventId: "222")
          FactoryBot.create(result_kind, :blind_mo3, competition: competition2)
        end

        expected_errors = [
          RV::ValidationError.new(:scrambles, competition1.id,
                                  SV::UNEXPECTED_SCRAMBLES_FOR_ROUND_ERROR,
                                  round_id: "333-f"),
          RV::ValidationError.new(:scrambles, competition2.id,
                                  SV::MISSING_SCRAMBLES_FOR_ROUND_ERROR,
                                  round_id: "333bf-f"),
        ]

        # Scrambles are shared between InboxResult and Result
        create_scramble_set(5, competitionId: competition1.id, eventId: "333oh")
        create_scramble_set(5, competitionId: competition1.id, eventId: "333")
        create_scramble_set(5, competitionId: competition2.id, eventId: "222")

        validator_args.each do |arg|
          sv = SV.new.validate(arg)
          expect(sv.warnings).to be_empty
          expect(sv.errors).to match_array(expected_errors)
        end
      end

      it "matches the competition's data" do
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          FactoryBot.create(result_kind, competition: competition1, eventId: "333oh")
          FactoryBot.create(result_kind, competition: competition2, eventId: "333bf")
        end

        FactoryBot.create(:round, competition: competition2, event_id: "333bf", format_id: "3")

        create_scramble_set(2, competitionId: competition2.id, eventId: "333bf")

        expected_errors = [
          RV::ValidationError.new(:scrambles, competition1.id,
                                  SV::MISSING_SCRAMBLES_FOR_COMPETITION_ERROR,
                                  competition_id: competition1.id),
          RV::ValidationError.new(:scrambles, competition2.id,
                                  SV::MISSING_SCRAMBLES_FOR_GROUP_ERROR,
                                  round_id: "333bf-f", group_id: "A",
                                  actual: 2, expected: 3),
        ]

        validator_args.each do |arg|
          sv = SV.new.validate(arg)
          expect(sv.warnings).to be_empty
          expect(sv.errors).to match_array(expected_errors)
        end
      end
    end
  end

  def create_scramble_set(n, **kwargs)
    1.upto(n) do |i|
      FactoryBot.create(:scramble, scrambleNum: i, **kwargs)
    end
  end
end
