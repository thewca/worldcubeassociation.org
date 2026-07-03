# frozen_string_literal: true

require "rails_helper"

RSpec.describe LiveResult do
  # Attempts entered so far, as the plain hashes the serializers produce.
  def attempt_hashes(*values)
    values.each_with_index.map { |value, i| { "value" => value, "attempt_number" => i + 1 } }
  end

  describe ".compute_projected_average" do
    context "average of 5" do
      let(:round) { create(:round, event_id: "333", format_id: "a") }

      it "means the current solves for 1 or 2 attempts" do
        expect(described_class.compute_projected_average([800], round)).to eq 800
        expect(described_class.compute_projected_average([800, 900], round)).to eq 850
      end

      it "takes the median for 3 attempts" do
        expect(described_class.compute_projected_average([900, 700, 800], round)).to eq 800
      end

      it "means the middle two for 4 attempts" do
        expect(described_class.compute_projected_average([700, 900, 1000, 1100], round)).to eq 950
      end

      it "is the average of 5 for a complete set" do
        expect(described_class.compute_projected_average([100, 101, 102, 103, 200], round)).to eq 102
      end

      it "returns SKIPPED for no attempts" do
        expect(described_class.compute_projected_average([], round)).to eq SolveTime::SKIPPED_VALUE
      end

      it "sorts a DNF as the worst attempt when taking the median" do
        expect(described_class.compute_projected_average([900, -1, 800], round)).to eq 900
      end

      it "is DNF when a DNF lands in the counting attempts" do
        expect(described_class.compute_projected_average([800, -1], round)).to eq SolveTime::DNF_VALUE
        expect(described_class.compute_projected_average([800, -1, 900, -1], round)).to eq SolveTime::DNF_VALUE
      end
    end

    context "mean of 3" do
      let(:round) { create(:round, event_id: "666", format_id: "m") }

      it "means the current complete solves" do
        expect(described_class.compute_projected_average([800, 900], round)).to eq 850
      end

      it "is DNF when any attempt is DNF" do
        expect(described_class.compute_projected_average([800, -1], round)).to eq SolveTime::DNF_VALUE
      end
    end

    context "333fm" do
      let(:round) { create(:round, event_id: "333fm", format_id: "m") }

      it "returns the scaled mean of the current solves" do
        expect(described_class.compute_projected_average([20], round)).to eq 2000
        expect(described_class.compute_projected_average([20, 21], round)).to eq 2050
        expect(described_class.compute_projected_average([20, 20, 21], round)).to eq 2033
      end

      it "is DNF when any attempt is DNF" do
        expect(described_class.compute_projected_average([20, -1], round)).to eq SolveTime::DNF_VALUE
      end
    end
  end

  describe ".compute_padded_average" do
    let(:round) { create(:round, event_id: "333", format_id: "a") }

    it "pads the missing solves with the best possible score" do
      expect(described_class.compute_padded_average(attempt_hashes(3642, 3102, 3001, 2992), round, LiveResult::BEST_POSSIBLE_SCORE)).to eq 3032
    end

    it "pads the missing solves with the worst possible score (existing DNF gets trimmed)" do
      expect(described_class.compute_padded_average(attempt_hashes(3642, 3102, 3001, 2992), round, LiveResult::WORST_POSSIBLE_SCORE)).to eq 3248
    end

    it "is DNF for best-possible when two attempts are already DNF" do
      expect(described_class.compute_padded_average(attempt_hashes(1000, -1, 1200, -1), round, LiveResult::BEST_POSSIBLE_SCORE)).to eq SolveTime::DNF_VALUE
    end

    it "is DNF for worst-possible when an attempt is already DNF" do
      expect(described_class.compute_padded_average(attempt_hashes(1000, -1, 1200, 1300), round, LiveResult::WORST_POSSIBLE_SCORE)).to eq SolveTime::DNF_VALUE
    end
  end

  describe ".compute_forecast_statistics" do
    let(:round) { create(:round, event_id: "333", format_id: "a") }

    it "returns the self-contained per-result stats" do
      stats = described_class.compute_forecast_statistics(attempt_hashes(800, 900), round)
      expect(stats.keys).to contain_exactly("best_possible_average", "worst_possible_average", "projected_average")
    end
  end
end
