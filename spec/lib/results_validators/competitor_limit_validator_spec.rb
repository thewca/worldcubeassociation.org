# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
CLV = RV::CompetitorLimitValidator

RSpec.describe CLV do
  context "on InboxResult and Result" do
    let!(:competition1) { create(:competition, :past, :with_competitor_limit, event_ids: ["333oh"], competitor_limit: 12) }
    let!(:competition2) { create(:competition, :past, :with_competitor_limit, event_ids: ["222"], competitor_limit: 10) }

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

    context "for competitions having a competitor limit" do
      let(:round_333oh) { create(:round, competition: competition1, event_id: "333oh") }
      let(:round_222) { create(:round, competition: competition2, event_id: "222") }

      before(:example) do
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create_list(result_kind, 10, competition: competition1, event_id: "333oh", round: round_333oh)
          create_list(result_kind, 10, competition: competition2, event_id: "222", round: round_222)
        end
      end

      it "doesn't complain when it's fine" do
        validator_args.each do |arg|
          clv = CLV.new.validate(**arg)
          expect(clv.warnings).to be_empty
          expect(clv.errors).to be_empty
        end
      end

      # Triggers:
      # COMPETITOR_LIMIT_WARNING
      it "complains when it should" do
        create(:result, competition: competition2, event_id: "222", round: round_222)
        create(:inbox_result, competition: competition2, event_id: "222", round: round_222)
        expected_warnings = [
          RV::ValidationWarning.new(CLV::COMPETITOR_LIMIT_WARNING,
                                    :persons, competition2.id,
                                    n_competitors: 11,
                                    competitor_limit: 10),
        ]

        validator_args.each do |arg|
          clv = CLV.new.validate(**arg)
          expect(clv.errors).to be_empty
          expect(clv.warnings).to match_array(expected_warnings)
        end
      end
    end

    context "for competitions without competitor limit enabled" do
      let(:round_333oh) { create(:round, competition: competition1, event_id: "333oh") }
      let(:round_222) { create(:round, competition: competition2, event_id: "222") }

      it "doesn't complain" do
        competition1.update(competitor_limit_enabled: false)
        competition2.update(competitor_limit_enabled: false)

        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create_list(result_kind, 12, competition: competition1, event_id: "333oh", round: round_333oh)
          create_list(result_kind, 12, competition: competition2, event_id: "222", round: round_222)
        end

        validator_args.each do |arg|
          clv = CLV.new.validate(**arg)
          expect(clv.errors).to be_empty
          expect(clv.warnings).to be_empty
        end
      end
    end
  end
end
