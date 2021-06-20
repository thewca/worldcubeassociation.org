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
        # Using a single fake person for all the results for better performance.
        fake_person = build_person(result_kind, competition1)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += FactoryBot.build_list(result_kind, 100, competition: competition1, eventId: "333oh", roundTypeId: "1", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 16, competition: competition1, eventId: "333oh", roundTypeId: "2", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 8, competition: competition1, eventId: "333oh", roundTypeId: "3", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 7, competition: competition1, eventId: "333oh", roundTypeId: "f", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 8, competition: competition2, eventId: "222", roundTypeId: "1", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 5, competition: competition2, eventId: "222", roundTypeId: "f", person: fake_person, skip_round_creation: true)
        model.import(results)
      end

      validator_args.each do |arg|
        acv = ACV.new.validate(**arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to be_empty
      end
    end

    it "ignores b-final" do
      # Using a single fake person for all the results for better performance.
      fake_person = build_person(:result, competition1)
      # Collecting all the results and using bulk import for better performance.
      results = []
      results += FactoryBot.build_list(:result, 100, competition: competition1, eventId: "333oh", roundTypeId: "1", person: fake_person, skip_round_creation: true)
      results += FactoryBot.build_list(:result, 8, competition: competition1, eventId: "333oh", roundTypeId: "b", person: fake_person, skip_round_creation: true)
      results += FactoryBot.build_list(:result, 32, competition: competition1, eventId: "333oh", roundTypeId: "f", person: fake_person, skip_round_creation: true)
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
    # REGULATION_9M_ERROR
    # REGULATION_9M1_ERROR
    # REGULATION_9M2_ERROR
    # REGULATION_9M3_ERROR
    # REGULATION_9P1_ERROR
    # OLD_REGULATION_9P_ERROR
    it "complains when it should" do
      [Result, InboxResult].each do |model|
        result_kind = model.model_name.singular.to_sym
        # Using a single fake person for all the results for better performance.
        fake_person = build_person(result_kind, competition1)
        # Collecting all the results and using bulk import for better performance.
        results = []
        results += FactoryBot.build_list(result_kind, 99, competition: competition1, eventId: "333oh", roundTypeId: "1", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 15, competition: competition1, eventId: "333oh", roundTypeId: "2", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 7, competition: competition1, eventId: "333oh", roundTypeId: "3", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 4, competition: competition1, eventId: "333oh", roundTypeId: "c", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 4, competition: competition1, eventId: "333oh", roundTypeId: "f", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 8, competition: competition2, eventId: "222", roundTypeId: "1", person: fake_person, skip_round_creation: true)
        results += FactoryBot.build_list(result_kind, 7, competition: competition2, eventId: "222", roundTypeId: "2", person: fake_person, skip_round_creation: true)
        model.import(results, validate: false)
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
        acv = ACV.new.validate(**arg)
        expect(acv.warnings).to be_empty
        expect(acv.errors).to match_array(expected_errors)
      end
    end
  end

  private

  def build_person(result_kind, competition)
    if result_kind == :result
      FactoryBot.build(:person)
    else
      FactoryBot.build(:inbox_person, competitionId: competition.id)
    end
  end
end
