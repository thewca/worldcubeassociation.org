# frozen_string_literal: true

require_relative '../../app/models/light_result'
require 'rails_helper'
require 'spec_helper'

RSpec.describe LightResult do
  def build_result(args)
    LightResult.new(args)
  end

  def solve_time(centis)
    SolveTime.new("333", :single, centis)
  end

  it "correctly computes best_index and worst_index" do
    result = build_result("event_id" => "333", "value1" => 10, "value2" => 30, "value3" => 50, "value4" => 40, "value5" => 60)
    expect(result.best_index).to eq 0
    expect(result.worst_index).to eq 4
  end

  describe "trimmed_indices" do
    it "trims best and worst for format: average" do
      result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => 40, "value5" => 50, "format_id" => "a"
      expect(result.trimmed_indices).to eq [1, 2]
    end

    it "does not trim anything for format: mean" do
      result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => 30, "format_id" => "m"
      expect(result.trimmed_indices).to eq []
    end

    it "handles cutoff rounds" do
      result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => SolveTime::SKIPPED_VALUE, "format_id" => "a"
      expect(result.trimmed_indices).to eq []
    end
  end

  describe "solves" do
    it "cutoff round and didn't make cutoff" do
      result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => SolveTime::SKIPPED_VALUE, "format_id" => "a"
      expect(result.format.expected_solve_count).to eq 5
      expect(result.solve_times).to eq [
        solve_time(20), solve_time(10), solve_time(60), SolveTime::SKIPPED, SolveTime::SKIPPED
      ]
    end

    it "returns 5 SolveTimes even for a round with 3 solves" do
      result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => SolveTime::SKIPPED_VALUE, "format_id" => "3"
      expect(result.format.expected_solve_count).to eq 3
      expect(result.solve_times).to eq [
        solve_time(20), solve_time(10), solve_time(60), SolveTime::SKIPPED, SolveTime::SKIPPED
      ]
    end
  end
end
