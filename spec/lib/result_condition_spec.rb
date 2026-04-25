# frozen_string_literal: true

require "rails_helper"

RSpec.describe ResultConditions::ResultCondition do
  shared_examples "a basic result condition" do |condition_type, valid_value, requires_value: true|
    if requires_value
      it "requires value" do
        input = {
          'type' => condition_type,
          'scope' => 'single',
        }
        result_condition = ResultConditions::ResultCondition.load(input)
        expect(result_condition).not_to be_valid
      end
    else
      it "does not require value" do
        input = {
          'type' => condition_type,
          'scope' => 'single',
        }
        result_condition = ResultConditions::ResultCondition.load(input)
        expect(result_condition).to be_valid
      end
    end

    it "requires scope" do
      input = {
        'type' => condition_type,
        'value' => valid_value,
      }
      result_condition = ResultConditions::ResultCondition.load(input)
      expect(result_condition).not_to be_valid
    end

    context "parses correctly" do
      it "with scope single" do
        input = {
          'type' => condition_type,
          'scope' => 'single',
          'value' => valid_value,
        }
        result_condition = ResultConditions::ResultCondition.load(input)
        expect(result_condition).to be_valid
      end

      it "with scope average" do
        input = {
          'type' => condition_type,
          'scope' => 'average',
          'value' => valid_value,
        }
        result_condition = ResultConditions::ResultCondition.load(input)
        expect(result_condition).to be_valid
      end
    end
  end

  context "Percent" do
    it_behaves_like "a basic result condition", 'percent', 50
  end

  context "Ranking" do
    it_behaves_like "a basic result condition", 'ranking', 100
  end

  context "Result Achieved" do
    it_behaves_like "a basic result condition", 'resultAchieved', 1000, requires_value: false
  end
end
