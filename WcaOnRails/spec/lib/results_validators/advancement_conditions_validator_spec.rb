# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
ACV = RV::AdvancementConditionsValidator

RSpec.describe ACV do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, starts: Date.new(2010, 3, 1), event_ids: ["333oh"]) }
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

    it "doesn't complain when it's fine" do
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        FactoryBot.create_list(result_kind, 100, competition: competition1, eventId: "333oh", roundTypeId: "1")
        FactoryBot.create_list(result_kind, 16, competition: competition1, eventId: "333oh", roundTypeId: "2")
        FactoryBot.create_list(result_kind, 8, competition: competition1, eventId: "333oh", roundTypeId: "3")
        FactoryBot.create_list(result_kind, 5, competition: competition1, eventId: "333oh", roundTypeId: "f")
        FactoryBot.create_list(result_kind, 8, competition: competition2, eventId: "222", roundTypeId: "1")
        FactoryBot.create_list(result_kind, 5, competition: competition2, eventId: "222", roundTypeId: "2")
      end

      validator_args.each do |arg|
        acv = ACV.new.validate(arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to be_empty
      end
    end

    # Triggers:
    # REGULATION_9M1_ERROR
    # REGULATION_9M2_ERROR
    # REGULATION_9M3_ERROR
    # REGULATION_9M_ERROR
    # REGULATION_9P1_ERROR
    it "complains when it should" do
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        FactoryBot.create_list(result_kind, 99, competition: competition1, eventId: "333oh", roundTypeId: "1")
        FactoryBot.create_list(result_kind, 15, competition: competition1, eventId: "333oh", roundTypeId: "2")
        FactoryBot.create_list(result_kind, 7, competition: competition1, eventId: "333oh", roundTypeId: "3")
        FactoryBot.create_list(result_kind, 4, competition: competition1, eventId: "333oh", roundTypeId: "c")
        FactoryBot.create_list(result_kind, 4, competition: competition1, eventId: "333oh", roundTypeId: "f")
        FactoryBot.create_list(result_kind, 8, competition: competition2, eventId: "222", roundTypeId: "1")
        FactoryBot.create_list(result_kind, 7, competition: competition2, eventId: "222", roundTypeId: "2")
      end

      expected_errors = [
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M1_ERROR,
                                round_id: "333oh-1"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M1_ERROR,
                                round_id: "333oh-2"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M2_ERROR,
                                round_id: "333oh-2"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M2_ERROR,
                                round_id: "333oh-3"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M3_ERROR,
                                round_id: "333oh-3"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M3_ERROR,
                                round_id: "333oh-c"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::REGULATION_9M_ERROR,
                                event_id: "333oh"),
        RV::ValidationError.new(:rounds, competition1.id,
                                ACV::OLD_REGULATION_9P_ERROR,
                                round_id: "333oh-f"),
        RV::ValidationError.new(:rounds, competition2.id,
                                ACV::REGULATION_9P1_ERROR,
                                round_id: "222-2"),
      ]

      validator_args.each do |arg|
        acv = ACV.new.validate(arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to match_array(expected_errors)
      end
    end
  end
end
