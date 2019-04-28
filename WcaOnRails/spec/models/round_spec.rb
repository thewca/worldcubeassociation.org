# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Round do
  it "defines a valid Round" do
    round = FactoryBot.build :round
    expect(round).to be_valid
  end

  context "format" do
    it "allows average of 5 for 333" do
      round = FactoryBot.build :round, event_id: "333", format_id: "a"
      expect(round).to be_valid
    end

    it "rejects mean of 3 for 333" do
      round = FactoryBot.build :round, event_id: "333", format_id: "m"
      expect(round).to be_invalid_with_errors(format: ["'m' is not allowed for '333'"])
    end
  end

  context "time limit" do
    let(:competition) { FactoryBot.create :competition, event_ids: %w(333 444bf 555bf) }
    let(:round) { FactoryBot.create :round, competition: competition, event_id: "333" }

    let!(:four_blind_round) { FactoryBot.create :round, competition: competition, event_id: "444bf", format_id: "3" }
    let!(:five_blind_round) { FactoryBot.create :round, competition: competition, event_id: "555bf", format_id: "3" }

    it "defaults to 10 minutes" do
      expect(round.time_limit).to eq(TimeLimit.new(centiseconds: 10.minutes.in_centiseconds, cumulative_round_ids: []))
      expect(round.time_limit_to_s).to eq "10:00.00"
    end

    it "set to 5 minutes" do
      round.update!(time_limit: TimeLimit.new(centiseconds: 5.minutes.in_centiseconds, cumulative_round_ids: ["333-r1"]))
      expect(round.time_limit.centiseconds).to eq 5.minutes.in_centiseconds
      expect(round.time_limit_to_s).to eq "5:00.00 cumulative"
    end

    it "set to 60 minutes shared between 444bf and 555bf" do
      four_blind_round.update!(time_limit: TimeLimit.new(centiseconds: 5.minutes.in_centiseconds, cumulative_round_ids: ["444bf-r1", "555bf-r1"]))
      expect(four_blind_round.time_limit.centiseconds).to eq 5.minutes.in_centiseconds
      expect(four_blind_round.time_limit_to_s).to eq "5:00.00 total for 4x4x4 Blindfolded Final and 5x5x5 Blindfolded Final"
    end
  end

  context "cutoff" do
    context "timed event" do
      let(:round) { FactoryBot.create :round, event_id: "333" }

      it "defaults to nil" do
        expect(round.cutoff).to eq nil
        expect(round.cutoff_to_s).to eq ""
      end

      it "2 attempts to break 50 seconds" do
        round.update!(cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 50*100))
        expect(round.cutoff.number_of_attempts).to eq 2
        expect(round.cutoff.attempt_result).to eq 50*100
        expect(round.cutoff_to_s).to eq "2 attempts to get < 50.00"
      end

      it "1 attempt to break 43 seconds" do
        round.update!(cutoff: Cutoff.new(number_of_attempts: 1, attempt_result: 43*100))
        expect(round.cutoff_to_s).to eq "1 attempt to get < 43.00"
      end

      it "times over 1 minute" do
        round.update!(cutoff: Cutoff.new(number_of_attempts: 3, attempt_result: 63*100))
        expect(round.cutoff_to_s).to eq "3 attempts to get < 1:03.00"
      end

      it "fractions of a second" do
        round.update!(cutoff: Cutoff.new(number_of_attempts: 3, attempt_result: 6343))
        expect(round.cutoff_to_s).to eq "3 attempts to get < 1:03.43"
      end
    end

    context "fmc" do
      let(:round) { FactoryBot.create :round, event_id: "333fm", format_id: "m" }

      it "defaults to nil" do
        expect(round.cutoff).to eq nil
        expect(round.cutoff_to_s).to eq ""
      end

      it "1 attempt to get 30 moves or better" do
        round.update!(cutoff: Cutoff.new(number_of_attempts: 1, attempt_result: 30))
        expect(round.cutoff_to_s).to eq "1 attempt to get < 30 moves"
      end
    end

    context "multibld" do
      let(:round) { FactoryBot.create :round, event_id: "333mbf", format_id: "3" }

      it "defaults to nil" do
        expect(round.cutoff).to eq nil
        expect(round.cutoff_to_s).to eq ""
      end

      it "1 attempt to get 4 points or better" do
        round.update!(cutoff: Cutoff.new(number_of_attempts: 1, attempt_result: SolveTime.points_to_multibld_attempt(4)))
        expect(round.cutoff_to_s).to eq "1 attempt to get > 4 points"
      end
    end
  end

  context "advance to next round requirement" do
    it "defaults to nil" do
      first_round = create_rounds("333", count: 1)[0]
      expect(first_round.advancement_condition).to eq nil
      expect(first_round.advancement_condition_to_s).to eq ""
    end

    it "set to top 16" do
      first_round, _second_round = create_rounds("333", count: 2)

      first_round.update!(advancement_condition: RankingCondition.new(16))
      expect(first_round.advancement_condition.ranking).to eq 16
      expect(first_round.advancement_condition_to_s).to eq "Top 16 advance to next round"
    end

    it "set to top 25%" do
      first_round, _second_round = create_rounds("333", count: 2)

      first_round.update!(advancement_condition: PercentCondition.new(25))
      expect(first_round.advancement_condition.percent).to eq 25
      expect(first_round.advancement_condition_to_s).to eq "Top 25% advance to next round"
    end

    it "not allowed on last round" do
      _first_round, second_round = create_rounds("333", count: 2)

      second_round.advancement_condition = RankingCondition.new(4)
      expect(second_round).to be_invalid_with_errors(advancement_condition: ["cannot be set on a final round"])
    end

    context "type attempt_result" do
      it "set to <= 3 minutes" do
        first_round, _second_round = create_rounds("333", count: 2)

        first_round.update!(advancement_condition: AttemptResultCondition.new(3.minutes.in_centiseconds))
        expect(first_round.advancement_condition_to_s).to eq "Best result < 3:00.00 advances to next round"
      end

      it "set to <= 35 moves" do
        first_round, _second_round = create_rounds("333fm", format_id: 'm', count: 2)

        first_round.update!(advancement_condition: AttemptResultCondition.new(35))
        expect(first_round.advancement_condition_to_s).to eq "Best result < 35 moves advances to next round"
      end

      it "set to >= 6 points" do
        first_round, _second_round = create_rounds("333mbf", format_id: '3', count: 2)

        first_round.update!(advancement_condition: AttemptResultCondition.new(SolveTime.points_to_multibld_attempt(6)))
        expect(first_round.advancement_condition_to_s).to eq "Best result > 6 points advances to next round"
      end
    end
  end
end

def create_rounds(event_id, format_id: 'a', count:)
  first_round = FactoryBot.create :round, number: 1, format_id: format_id, event_id: event_id, total_number_of_rounds: count
  remaining_rounds = (2..count).map do |number|
    FactoryBot.create :round, number: number, format_id: format_id, competition_event: first_round.competition_event, total_number_of_rounds: count
  end
  [first_round] + remaining_rounds
end
