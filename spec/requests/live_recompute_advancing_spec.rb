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

      it 'considers average tied but better single' do
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

    describe "tie handling" do
      context "with a ranking advancement condition" do
        it "excludes all results tied at the qualifying boundary" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: ranking_condition)

          create(:live_result, registration: registrations[0], round: round, average: 100)
          create(:live_result, registration: registrations[1], round: round, average: 200)
          # Tied at rank 3 — the boundary. Including both would exceed the condition,
          # so neither advances (tie group is excluded together).
          create(:live_result, registration: registrations[2], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[3], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, false, false, false])
        end

        it "advances all results tied within the qualifying zone" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: ranking_condition)

          create(:live_result, registration: registrations[0], round: round, average: 100)
          # Tied at rank 2 — both are comfortably within the top 3, so both advance.
          create(:live_result, registration: registrations[1], round: round, average: 200, best: 100)
          create(:live_result, registration: registrations[2], round: round, average: 200, best: 100)
          create(:live_result, registration: registrations[3], round: round, average: 300)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, true, false, false])
        end
      end

      context "with a percent advancement condition" do
        it "excludes all results tied at the qualifying boundary" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

          create(:live_result, registration: registrations[0], round: round, average: 100)
          # 40% of 5 = 2. These two are tied for rank 2 — advancing both would exceed
          # the condition, so neither advances.
          create(:live_result, registration: registrations[1], round: round, average: 200, best: 100)
          create(:live_result, registration: registrations[2], round: round, average: 200, best: 100)
          create(:live_result, registration: registrations[3], round: round, average: 300)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, false, false, false, false])
        end

        it "advances all results tied within the qualifying zone" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

          # 40% of 5 = 2. Two are tied at rank 1 — both are inside the qualifying zone.
          create(:live_result, registration: registrations[0], round: round, average: 100, best: 50)
          create(:live_result, registration: registrations[1], round: round, average: 100, best: 50)
          create(:live_result, registration: registrations[2], round: round, average: 200)
          create(:live_result, registration: registrations[3], round: round, average: 300)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, false, false, false])
        end
      end

      context "with an attempt_result advancement condition" do
        it "excludes all results tied exactly at the cutoff time" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)

          create(:live_result, registration: registrations[0], round: round, average: 100)
          create(:live_result, registration: registrations[1], round: round, average: 200)
          # Both tied exactly at the 3-second cutoff. The condition requires strictly
          # better than 300, so neither qualifies.
          create(:live_result, registration: registrations[2], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[3], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, false, false, false])
        end

        it "advances all results tied well within the cutoff" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)

          # Both are comfortably under 3 seconds, so both qualify.
          create(:live_result, registration: registrations[0], round: round, average: 100, best: 50)
          create(:live_result, registration: registrations[1], round: round, average: 100, best: 50)
          create(:live_result, registration: registrations[2], round: round, average: 400)
          create(:live_result, registration: registrations[3], round: round, average: 500)
          create(:live_result, registration: registrations[4], round: round, average: 600)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, false, false, false])
        end
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
        expect(round.live_results.pluck(:global_pos, :advancing)).to eq([[1, false], [2, true], [3, true], [4, false], [5, false]])
      end
    end

    context "with quit results" do
      it "quit from first round excludes from competitors" do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)
        registration_1 = registrations.first

        # Open Round
        round.open_and_lock_previous(User.first)

        # Quit Competitor
        round.quit_from_round!(registration_1.id, User.first)

        # Quit users is not part of the rounds competitors
        expect(round.live_competitors.count).to eq 4
        expect(round.live_competitors.pluck(:registration_id)).not_to include registrations.first.id
      end

      it "quit from next round marks as no advancing in previous round" do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)
        final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # Open next round and quit first result from it
        final.open_and_lock_previous(User.first)
        final.quit_from_round!(registrations.first.id, User.first)

        # Quit user is marked as not advancing
        expect(round.live_results.reload.pluck(:global_pos, :advancing)).to eq([[1, false], [2, true], [3, false], [4, false], [5, false]])

        # Quit users is not part of the final round competitors
        expect(final.live_competitors.count).to eq 1
        expect(final.live_competitors.first.id).to eq registrations.second.id

        # But still part of the first round competitors
        expect(round.live_competitors.count).to eq 5
      end
    end
  end
end
