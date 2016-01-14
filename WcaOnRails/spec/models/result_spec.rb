require 'rails_helper'

def solve_time(centis)
  SolveTime.new("333", :single, centis)
end

RSpec.describe Result do
  it "defines a valid result" do
    result = FactoryGirl.build :result
    expect(result).to be_valid
  end

  it "formats best just seconds" do
    result = FactoryGirl.build :result, best: 4242
    expect(result.to_s :best).to eq "42.42"
  end

  it "formats best minutes" do
    result = FactoryGirl.build :result, best: 3*60*100 + 4242
    expect(result.to_s :best).to eq "3:42.42"
  end

  it "formats best hours" do
    result = FactoryGirl.build :result, best: 2*60*100*60 + 3*60*100 + 4242
    expect(result.to_s :best).to eq "2:03:42.42"
  end

  it "correctly computes best_index and worst_index" do
    result = FactoryGirl.build :result, value1: 10, value2: 30, value3: 50, value4: 40, value5: 60
    expect(result.best_index).to eq 0
    expect(result.worst_index).to eq 4
  end

  describe "solves" do
    it "combined round and didn't make cutoff" do
      result = FactoryGirl.build :result, value1: 20, value2: 10, value3: 60, value4: SolveTime::SKIPPED_VALUE, value5: SolveTime::SKIPPED_VALUE, average: SolveTime::SKIPPED_VALUE, formatId: "a"
      expect(result.format.expected_solve_count).to eq 5
      expect(result.solves).to eq [
        solve_time(20), solve_time(10), solve_time(60), SolveTime::SKIPPED, SolveTime::SKIPPED
      ]
    end

    it "returns 5 SolveTimes even for a round with 3 solves" do
      result = FactoryGirl.build :result, value1: 20, value2: 10, value3: 60, value4: SolveTime::SKIPPED_VALUE, value5: SolveTime::SKIPPED_VALUE, average: SolveTime::SKIPPED_VALUE, formatId: "3"
      expect(result.format.expected_solve_count).to eq 3
      expect(result.solves).to eq [
        solve_time(20), solve_time(10), solve_time(60), SolveTime::SKIPPED, SolveTime::SKIPPED
      ]
    end
  end

  describe "trimmed_indices" do
    it "trims best and worst for format: average" do
      result = FactoryGirl.build :result, value1: 20, value2: 10, value3: 60, value4: 40, value5: 50, formatId: "a"
      expect(result.trimmed_indices).to eq [ 1, 2 ]
    end

    it "does not trim anything for format: mean" do
      result = FactoryGirl.build :result, value1: 20, value2: 10, value3: 60, value4: SolveTime::SKIPPED_VALUE, value5: SolveTime::SKIPPED_VALUE, average: 30, formatId: "m"
      expect(result.trimmed_indices).to eq []
    end

    it "handles combined rounds" do
      result = FactoryGirl.build :result, value1: 20, value2: 10, value3: 60, value4: SolveTime::SKIPPED_VALUE, value5: SolveTime::SKIPPED_VALUE, average: SolveTime::SKIPPED_VALUE, formatId: "a"
      expect(result.trimmed_indices).to eq []
    end
  end

  describe "333fm" do
    it "formats best" do
      result = FactoryGirl.build :result, eventId: "333fm", best: 32
      expect(result.to_s :best).to eq "32"
    end

    it "formats average" do
      result = FactoryGirl.build :result, eventId: "333fm", average: 3267
      expect(result.to_s :average).to eq "32.67"

      result.update_attribute(:average, 2500)
      expect(result.to_s :average).to eq "25.00"
    end
  end

  describe "333mbf" do
    it "formats best" do
      result = FactoryGirl.build :result, eventId: "333mbf", best: 580325400
      expect(result.to_s :best).to eq "41/41 54:14"
    end
  end

  describe "333mbo" do
    it "formats best" do
      result = FactoryGirl.build :result, eventId: "333mbo", best: 1960706900
      expect(result.to_s :best).to eq "3/7 1:55:00"
    end

    it "handles missing times" do
      result = FactoryGirl.build :result, eventId: "333mbo", best: 969999900
      expect(result.to_s :best).to eq "3/3 ?:??:??"
    end
  end
end
