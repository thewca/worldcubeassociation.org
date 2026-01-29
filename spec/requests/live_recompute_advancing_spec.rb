# frozen_string_literal: true

require "rails_helper"

def ranking_condition
  AdvancementConditions::RankingCondition.new(3)
end

def percent_condition
  AdvancementConditions::PercentCondition.new(40)
end

def attempt_result_condition
  AdvancementConditions::AttemptResultCondition.new(300)
end

RSpec.describe "WCA Live API" do
  describe "Advancing Recomputation" do
    let(:competition) { create(:competition, event_ids: ["333"]) }
    let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    context 'with a ranking advancement condition' do
      it 'returns results with ranking better or equal to the given level' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: ranking_condition)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        expect(round.live_results.pluck(:advancing)).to eq([true, true, true, false, false])
      end
    end

    context 'with a percent advancement condition' do
      it 'returns results with ranking better or equal to the given level' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # 40% of 5 is exactly 2.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end

      it 'considers ties' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, best: (i + 1) * 100, average: 300)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # 40% of 5 is exactly 2.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end

      it 'considers dnfs' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

        4.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        create(:live_result, registration: registrations[4], round: round, average: -1)

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # 40% of 5 is exactly 2.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end

      it 'considers dns' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

        4.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        create(:live_result, registration: registrations[4], round: round, average: -2)

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # 40% of 5 is exactly 2.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end
    end

    context 'with an attempt_result advancement condition' do
      it 'returns results with ranking better or equal to the given level' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # Only strictly _better_ than 3 seconds will proceed, so that's two entries.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end
    end

    context "with locked results" do
      it "doesn't change advancing of locked results" do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        round.lock_results(User.first)
        # Update best/average after locking
        round.live_results.last.update(average: 50)

        # Advancing is not updated, but ranking is
        expect(round.live_results.pluck(:ranking, :advancing)).to eq([[1, false], [2, true], [3, true], [4, false], [5, false]])
      end
    end
  end
end
