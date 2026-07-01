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
        expect(described_class.compute_projected_average([], round)).to eq LiveResult::SKIPPED_VALUE
      end
    end

    context "mean of 3" do
      let(:round) { create(:round, event_id: "666", format_id: "m") }

      it "means the current complete solves" do
        expect(described_class.compute_projected_average([800, 900], round)).to eq 850
      end
    end

    context "333fm" do
      let(:round) { create(:round, event_id: "333fm", format_id: "m") }

      it "returns the scaled mean of the current solves" do
        expect(described_class.compute_projected_average([20], round)).to eq 2000
        expect(described_class.compute_projected_average([20, 21], round)).to eq 2050
        expect(described_class.compute_projected_average([20, 20, 21], round)).to eq 2033
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
      expect(described_class.compute_padded_average(attempt_hashes(1000, -1, 1200, -1), round, LiveResult::BEST_POSSIBLE_SCORE)).to eq LiveResult::DNF_VALUE
    end

    it "is DNF for worst-possible when an attempt is already DNF" do
      expect(described_class.compute_padded_average(attempt_hashes(1000, -1, 1200, 1300), round, LiveResult::WORST_POSSIBLE_SCORE)).to eq LiveResult::DNF_VALUE
    end
  end

  describe ".time_needed_to_overtake" do
    def res(attempts, best, projected = nil)
      { attempts: attempts, best: best, projected_average: projected }
    end

    def ot(best, projected)
      { best: best, projected_average: projected }
    end

    let(:ao5) { { number_of_attempts: 5 } }
    let(:mo3) { { number_of_attempts: 3 } }

    it "returns DNF if the overtake result is skipped" do
      expect(described_class.time_needed_to_overtake(nil, nil, ot(nil, 0))).to eq LiveResult::DNF_VALUE
    end

    context "projection turning from a mean to an average (Ao5, 2 attempts)" do
      it "returns DNF when the worst possible average already beats/ties+best" do
        result = res([99, 100], 99)
        expect(described_class.time_needed_to_overtake(result, ao5, ot(10, 101))).to eq LiveResult::DNF_VALUE
        expect(described_class.time_needed_to_overtake(result, ao5, ot(100, 100))).to eq LiveResult::DNF_VALUE
      end

      it "resolves best-possible cases (with best tiebreak / incomplete target)" do
        result = res([100, -1], 100)
        expect(described_class.time_needed_to_overtake(result, ao5, ot(100, 110))).to eq 109
        expect(described_class.time_needed_to_overtake(result, ao5, ot(101, 110))).to eq 110
        expect(described_class.time_needed_to_overtake(result, ao5, ot(50, -1))).to eq LiveResult::SUCCESS_VALUE
        expect(described_class.time_needed_to_overtake(result, ao5, ot(50, 100))).to eq 49
        expect(described_class.time_needed_to_overtake(result, ao5, ot(50, 50))).to eq LiveResult::NA_VALUE
      end

      it "wins on best when both averages are incomplete" do
        expect(described_class.time_needed_to_overtake(res([-1, -1], -1), ao5, ot(-1, -1))).to eq LiveResult::SUCCESS_VALUE
      end
    end

    context "incomplete overtake target" do
      it "handles the various incomplete-target outcomes" do
        overtake = ot(50, -1)
        expect(described_class.time_needed_to_overtake(res([49], 49, 49), ao5, overtake)).to eq LiveResult::DNF_VALUE
        expect(described_class.time_needed_to_overtake(res([100, 100, 100, 100], 100, 100), ao5, overtake)).to eq LiveResult::DNF_VALUE
        expect(described_class.time_needed_to_overtake(res([100, 100, -1, -1], 100, -1), ao5, overtake)).to eq 49
        expect(described_class.time_needed_to_overtake(res([100], 100, 100), ao5, overtake)).to eq LiveResult::SUCCESS_VALUE
        expect(described_class.time_needed_to_overtake(res([-1], -1, -1), ao5, ot(-1, -1))).to eq LiveResult::SUCCESS_VALUE
      end

      it "returns NA when the result's own average can't complete" do
        expect(described_class.time_needed_to_overtake(res([50, -1], 50, -1), mo3, ot(50, 50))).to eq LiveResult::NA_VALUE
      end
    end

    context "overtake for a mean" do
      it "computes the needed single with best tiebreak and rounding buffer" do
        expect(described_class.time_needed_to_overtake(res([110], 110, 110), mo3, ot(100, 100))).to eq 90
        expect(described_class.time_needed_to_overtake(res([110, 110], 110, 110), mo3, ot(100, 100))).to eq 81
        expect(described_class.time_needed_to_overtake(res([110], 110, 110), mo3, ot(50, 100))).to eq 88
        expect(described_class.time_needed_to_overtake(res([110, 110], 110, 110), mo3, ot(50, 100))).to eq 78
        expect(described_class.time_needed_to_overtake(res([110, 110], 110, 110), mo3, ot(80, 100))).to eq 79
        # Ao5 with a single attempt is still treated as a mean.
        expect(described_class.time_needed_to_overtake(res([110], 110, 110), ao5, ot(100, 100))).to eq 90
      end
    end

    context "overtake for an average" do
      it "drops best/worst and applies the best tiebreak" do
        overtake = ot(50, 100)
        expect(described_class.time_needed_to_overtake(res([10, 110, -1], 10, 110), ao5, overtake)).to eq 90
        expect(described_class.time_needed_to_overtake(res([50, 110, -1], 50, 110), ao5, overtake)).to eq 88
        expect(described_class.time_needed_to_overtake(res([10, 110, 110, 200], 10, 110), ao5, overtake)).to eq 81
        expect(described_class.time_needed_to_overtake(res([50, 110, 110, 200], 50, 110), ao5, overtake)).to eq 78
        expect(described_class.time_needed_to_overtake(res([110, 110, 110], 110, 110), ao5, overtake)).to eq LiveResult::NA_VALUE
        expect(described_class.time_needed_to_overtake(res([90, 90, 90], 90, 90), ao5, overtake)).to eq LiveResult::DNF_VALUE
      end
    end
  end

  describe "#forecast_statistics for_first/for_advance (target selection)" do
    # Force the standings order without relying on recompute.
    def standings(round, rows)
      rows.each_with_index.map do |(values, best, average), i|
        result = create(:live_result, round: round, attempts_count: 0)
        result.live_attempts = values.each_with_index.map { |v, n| LiveAttempt.new(value: v, attempt_number: n + 1) }
        result.save!
        result.update_columns(best: best, average: average, global_pos: i + 1)
        result
      end.tap { round.live_results.reload }
    end

    it "targets rank 1 for everyone but the leader, who targets rank 2 (Mo3)" do
      round = create(:round, event_id: "666", format_id: "m")
      results = standings(round, [
                            [[100], 100, 0],
                            [[101], 101, 0],
                            [[102], 102, 0],
                            [[103], 103, 0],
                            [[104, 104, 104], 104, 104],
                          ])

      expect(results[0].forecast_statistics).to include("for_first" => 102, "for_advance" => 106)
      expect(results[1].forecast_statistics).to include("for_first" => 99, "for_advance" => 105)
      expect(results[2].forecast_statistics).to include("for_first" => 98, "for_advance" => 104)
      expect(results[3].forecast_statistics).to include("for_first" => 97, "for_advance" => 101)
      # The last competitor is complete → no forecast at all.
      expect(results[4].forecast_statistics).to be_nil
    end

    it "uses the advancement level for for_advance" do
      round = create(:round, event_id: "666", format_id: "m")
      results = standings(round, [
                            [[100], 100, 0],
                            [[101], 101, 0],
                            [[102], 102, 0],
                          ])
      # Set the level in memory — forecast only reads it, and results share this
      # round instance, so we avoid the advancing recompute a real one triggers.
      round.advancement_condition = AdvancementConditions::RankingCondition.new(2)

      expect(results[0].forecast_statistics["for_advance"]).to eq 104
      expect(results[1].forecast_statistics["for_advance"]).to eq 103
      expect(results[2].forecast_statistics["for_advance"]).to eq 100
    end

    it "does not set for_first/for_advance for fewest moves" do
      round = create(:round, event_id: "333fm", format_id: "m")
      results = standings(round, [
                            [[20], 20, 0],
                            [[20], 20, 0],
                          ])

      expect(results[0].forecast_statistics).to include("for_first" => 0, "for_advance" => 0)
      expect(results[1].forecast_statistics).to include("for_first" => 0, "for_advance" => 0)
    end
  end

  describe ".compute_forecast_statistics" do
    let(:round) { create(:round, event_id: "333", format_id: "a") }

    it "returns the self-contained per-result stats (no for_first/for_advance)" do
      stats = described_class.compute_forecast_statistics(attempt_hashes(800, 900), round)
      expect(stats.keys).to contain_exactly("best_possible_average", "worst_possible_average", "projected_average")
    end
  end
end
