# frozen_string_literal: true

require "rails_helper"

def ranking_condition
  ResultConditions::Ranking.new(scope: "average", value: 3)
end

def percent_condition
  ResultConditions::Percent.new(scope: "average", value: 40)
end

def attempt_result_condition
  ResultConditions::ResultAchieved.new(scope: "average", value: 300)
end

RSpec.describe "WCA Live API" do
  let(:competition) { create(:competition, event_ids: ["333"]) }
  let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

  describe "Advancing Recomputation" do
    context 'with a ranking advancement condition' do
      it 'returns results with ranking better or equal to the given level' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

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
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # 40% of 5 is exactly 2.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end

      it 'considers average tied but better single' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, best: (i + 1) * 100, average: 300)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # 40% of 5 is exactly 2.
        expect(round.live_results.pluck(:advancing)).to eq([true, true, false, false, false])
      end

      it 'considers dnfs' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

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
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

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

    context 'with a cutoff' do
      it 'does not mark as advancing competitors who did not meet the cutoff' do
        cutoff = Cutoff.new(number_of_attempts: 2, attempt_result: 5000)
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, cutoff: cutoff)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

        registrations # ensure registrations are created before opening the round
        round.open_round!(User.first)
        live_results = round.live_results

        # 3 competitors met the cutoff (at least one attempt < 5000 in first 2)
        3.times do |i|
          result = live_results.find_by!(registration_id: registrations[i].id)
          UpdateLiveResultJob.perform_now(result, Array.new(5) { |j| { value: (i + 1) * 1000, attempt_number: j + 1 } }, User.first.id)
        end

        # 2 competitors did NOT meet the cutoff (both first 2 attempts >= 5000)
        2.times do |i|
          result = live_results.find_by!(registration_id: registrations[3 + i].id)
          UpdateLiveResultJob.perform_now(result, [{ value: 6000, attempt_number: 1 }, { value: 7000, attempt_number: 2 }], User.first.id)
        end

        no_cutoff_ids = [registrations[3].id, registrations[4].id]
        expect(round.live_results.reload.where(registration_id: no_cutoff_ids).pluck(:advancing)).to all(be false)
        expect(round.live_results.reload.where.not(registration_id: no_cutoff_ids).pluck(:advancing)).to all(be true)
      end

      it 'does not mark as advancing competitors who did not meet the cutoff when they have a dnf' do
        cutoff = Cutoff.new(number_of_attempts: 2, attempt_result: 5000)
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, cutoff: cutoff)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

        registrations # ensure registrations are created before opening the round
        round.open_round!(User.first)
        live_results = round.live_results

        # 3 competitors met the cutoff (at least one attempt < 5000 in first 2)
        3.times do |i|
          result = live_results.find_by!(registration_id: registrations[i].id)
          UpdateLiveResultJob.perform_now(result, Array.new(5) { |j| { value: (i + 1) * 1000, attempt_number: j + 1 } }, User.first.id)
        end

        # 2 competitors did NOT meet the cutoff (both first 2 attempts >= 5000)
        2.times do |i|
          result = live_results.find_by!(registration_id: registrations[3 + i].id)
          UpdateLiveResultJob.perform_now(result, [{ value: 6000, attempt_number: 1 }, { value: -1, attempt_number: 2 }], User.first.id)
        end

        no_cutoff_ids = [registrations[3].id, registrations[4].id]
        expect(round.live_results.reload.where(registration_id: no_cutoff_ids).pluck(:advancing)).to all(be false)
        expect(round.live_results.reload.where.not(registration_id: no_cutoff_ids).pluck(:advancing)).to all(be true)
      end

      it 'with missing results' do
        cutoff = Cutoff.new(number_of_attempts: 2, attempt_result: 5000)
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, cutoff: cutoff)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

        registrations # ensure registrations are created before opening the round
        round.open_round!(User.first)
        live_results = round.live_results

        # 3 competitors met the cutoff (at least one attempt < 5000 in first 2)
        3.times do |i|
          result = live_results.find_by!(registration_id: registrations[i].id)
          UpdateLiveResultJob.perform_now(result, Array.new(5) { |j| { value: (i + 1) * 1000, attempt_number: j + 1 } }, User.first.id)
        end

        # We are still missing two results so only the first result should be marked as advancing
        expect(round.live_results.reload.where(registration_id: [registrations.first]).pluck(:advancing)).to all(be true)
        expect(round.live_results.reload.where.not(registration_id: [registrations.first]).pluck(:advancing)).to all(be false)
      end
    end

    context 'with an attempt_result advancement condition' do
      it 'returns results with ranking better or equal to the given level' do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round)

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
        it "excludes all results tied at the qualifying boundary if over the 75% rule" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

          create(:live_result, registration: registrations[0], round: round, average: 100)
          create(:live_result, registration: registrations[1], round: round, average: 200)
          # Tied at rank 3 — the boundary. Including both would exceed the 75% rule,
          # so neither advances (tie group is excluded together).
          create(:live_result, registration: registrations[2], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[3], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, false, false, false])
        end

        it "excludes all results tied at the qualifying boundary that are also tied with previous results if over the 75% rule" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

          # These are all tied and if all would advance it would break the 75% rule so no one advances
          create(:live_result, registration: registrations[0], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[1], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[2], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[3], round: round, average: 300, best: 150)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([false, false, false, false, false])
        end

        it "advances all results tied within the qualifying zone" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round)

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
        it "doesn't exclude results tied at the qualifying boundary when still in the 75% boundary" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

          create(:live_result, registration: registrations[0], round: round, average: 100)
          # 40% of 5 = 2. These two are tied for rank 2 — advancing both would exceed
          # the condition, but is still under the 75% so they still proceed
          create(:live_result, registration: registrations[1], round: round, average: 200, best: 100)
          create(:live_result, registration: registrations[2], round: round, average: 200, best: 100)
          create(:live_result, registration: registrations[3], round: round, average: 300)
          create(:live_result, registration: registrations[4], round: round, average: 400)

          expect(round.live_results.order(:average, :best).pluck(:advancing)).to eq([true, true, true, false, false])
        end

        it "advances all results tied within the qualifying zone" do
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

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
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round)

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
          round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
          create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round)

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
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round)

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

    context "with linked rounds (second round partially entered)" do
      context "with ranking condition" do
        let!(:linked) { create(:linked_round) }
        let!(:round1) { create(:round, number: 1, total_number_of_rounds: 3, event_id: "333", competition: competition, linked_round: linked) }
        let!(:round2) { create(:round, number: 2, total_number_of_rounds: 3, event_id: "333", competition: competition, linked_round: linked) }
        let!(:round3) { create(:round, number: 3, total_number_of_rounds: 3, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: linked) }

        # Enter round2 for a competitor using uniform attempts (all = target) so Ao5 average == target.
        def enter_round2(registration, average)
          result = round2.live_results.find_by!(registration_id: registration.id)
          attempts = Array.new(5) { |i| { value: average, attempt_number: i + 1 } }
          UpdateLiveResultJob.perform_now(result, attempts, User.first.id)
        end

        before do
          5.times do |i|
            create(:live_result, registration: registrations[i], round: round1, average: (i + 1) * 100)
          end
          round2.open_round!(User.first)
        end

        it "does not set advancing when missing round2 results could still change the outcome" do
          # Only 1 of 5 has entered round2 — 4 potential results could rank 1st through 4th,
          # pushing all real results outside the top 3
          enter_round2(registrations[0], 50)

          expect(round1.live_results.reload.pluck(:advancing)).to all(be false)
          expect(round2.live_results.reload.pluck(:advancing)).to all(be false)
        end

        it "sets advancing for results guaranteed to finish in the top 3 despite one missing round2 attempt" do
          # 4 of 5 entered round2 with better results than round1; only registrations[4] is still missing
          4.times { |i| enter_round2(registrations[i], (i + 1) * 50) }

          # With 1 potential result at best-possible rank, the sorted order is:
          #   [potential(1cs), reg[0](50), reg[1](100), reg[2](150), reg[3](200), reg[4](500 from round1)]
          # Top 3 = potential + reg[0] + reg[1] → reg[0] and reg[1] are advancing
          advancing_ids = round2.live_results.reload.where(advancing: true).pluck(:registration_id)
          expect(advancing_ids).to contain_exactly(registrations[0].id, registrations[1].id)

          # Also correctly sets it for round 1
          advancing_ids = round1.live_results.reload.where(advancing: true).pluck(:registration_id)
          expect(advancing_ids).to contain_exactly(registrations[0].id, registrations[1].id)
        end
      end

      context "with percent condition" do
        let!(:linked) { create(:linked_round) }
        let!(:round1) { create(:round, number: 1, total_number_of_rounds: 3, event_id: "333", competition: competition, linked_round: linked) }
        let!(:round2) { create(:round, number: 2, total_number_of_rounds: 3, event_id: "333", competition: competition, linked_round: linked) }
        let!(:round3) { create(:round, number: 3, total_number_of_rounds: 3, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: linked) }

        # Enter round2 for a competitor using uniform attempts (all = target) so Ao5 average == target.
        def enter_round2(registration, average)
          result = round2.live_results.find_by!(registration_id: registration.id)
          attempts = Array.new(5) { |i| { value: average, attempt_number: i + 1 } }
          UpdateLiveResultJob.perform_now(result, attempts, User.first.id)
        end

        before do
          5.times do |i|
            create(:live_result, registration: registrations[i], round: round1, average: ((i + 1) * 100) + 1, best: ((i + 1) * 100) + 1)
          end
          round2.open_round!(User.first)
        end

        it "does not set advancing when missing round2 results could still change the outcome" do
          # Only 3 of 5 has entered round2 — 2 potential results could rank 1st through 2nd,
          # pushing all real results outside the top 2
          enter_round2(registrations[0], 50)
          enter_round2(registrations[1], 50)
          enter_round2(registrations[2], 50)

          expect(round1.live_results.reload.pluck(:advancing)).to all(be false)
          expect(round2.live_results.reload.pluck(:advancing)).to all(be false)
        end

        it "sets advancing for results guaranteed to finish in the top 2 despite one missing round2 attempt" do
          # 4 of 5 entered round2 with better results than round1; only registrations[4] is still missing
          4.times { |i| enter_round2(registrations[i], (i + 1) * 50) }

          # With 1 potential result at best-possible rank, the sorted order is:
          #   [potential(1cs), reg[0](50), reg[1](100), reg[2](150), reg[3](200), reg[4](250)]
          # Top 2 = potential + reg[0] → reg[0] advances
          advancing_ids = round2.live_results.reload.where(advancing: true).pluck(:registration_id)
          expect(advancing_ids).to contain_exactly(registrations[0].id)
        end
      end
    end

    context "with quit results" do
      it "quit from first round excludes from competitors" do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round)
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
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round)

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

      it "quit from next round advances next competitor if set" do
        round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
        final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

        5.times do |i|
          create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
        end

        expect(round.total_competitors).to eq 5
        expect(round.competitors_live_results_entered).to eq 5

        # Open next round and quit first result from it while letting the next one advance
        final.open_and_lock_previous(User.first)
        to_advance = final.next_participating_without(registrations.first.id)
        final.quit_from_round!(registrations.first.id, User.first, to_advance: to_advance)

        # Next Competitor is marked as advancing
        expect(round.live_results.reload.pluck(:global_pos, :advancing)).to eq([[1, false], [2, true], [3, true], [4, false], [5, false]])

        # Two competitors advance
        expect(final.live_competitors.count).to eq 2
        expect(final.live_competitors.second.id).to eq registrations.third.id
      end
    end
  end

  describe "Advancing Questionable" do
    context 'with Percent Condition' do
      let!(:round1) { create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition) }
      let!(:round2) { create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round1) }

      it 'correctly sets advancing questionable to true if the first result is entered' do
        registration = registrations.first
        round1.open_round!(User.first)

        live_results = round1.live_results

        expect(live_results.count).to be 5

        registration_result = live_results.find_by!(registration_id: registration.id)

        UpdateLiveResultJob.perform_now(registration_result, Array.new(5) { |i| { value: (i + 1) * 500, attempt_number: i + 1 } }, User.first.id)

        expect(registration_result.reload.advancing_questionable).to be true
      end
    end

    context 'with RankingCondition (top 3 advance)' do
      let!(:round1) { create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition) }
      let!(:round2) { create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round1) }

      it 'correctly sets advancing questionable to true if the first result is entered' do
        registration = registrations.first
        round1.open_round!(User.first)

        live_results = round1.live_results

        expect(live_results.count).to be 5

        registration_result = live_results.find_by!(registration_id: registration.id)

        UpdateLiveResultJob.perform_now(registration_result, Array.new(5) { |i| { value: (i + 1) * 500, attempt_number: i + 1 } }, User.first.id)

        expect(registration_result.reload.advancing_questionable).to be true
      end
    end

    context 'with AttemptResultCondition' do
      let!(:round1) { create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition) }
      let!(:round2) { create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round1) }

      it 'correctly sets advancing questionable to true if the first result entered is under the condition' do
        registration = registrations.first
        round1.open_round!(User.first)

        live_results = round1.live_results

        expect(live_results.count).to be 5

        registration_result = live_results.find_by!(registration_id: registration.id)

        UpdateLiveResultJob.perform_now(registration_result, Array.new(5) { |i| { value: (i + 1) * 50, attempt_number: i + 1 } }, User.first.id)

        registration_result.reload

        expect(registration_result.average).to be 150
        expect(registration_result.advancing_questionable).to be true
      end

      it 'correctly sets advancing questionable to false if the first result entered is above the condition' do
        registration = registrations.first
        round1.open_round!(User.first)

        live_results = round1.live_results

        expect(live_results.count).to be 5

        registration_result = live_results.find_by!(registration_id: registration.id)

        UpdateLiveResultJob.perform_now(registration_result, Array.new(5) { |i| { value: (i + 1) * 500, attempt_number: i + 1 } }, User.first.id)

        registration_result.reload

        expect(registration_result.average).to be 1500
        expect(registration_result.advancing_questionable).to be false
      end
    end
  end

  describe 'Next Advancing to round' do
    context 'with RankingCondition (top 3 advance)' do
      let!(:round1) { create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition) }
      let!(:round2) { create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: round1) }

      it 'returns the next ranked person after the cutoff' do
        5.times { |i| create(:live_result, registration: registrations[i], round: round1, average: (i + 1) * 100) }

        # Ranks 1-3 advance; rank 4 is the next qualifying person
        next_qualifying = round2.next_participating_without(registrations.first)
        expect(next_qualifying.map(&:registration_id)).to contain_exactly(registrations[3].id)
      end

      it 'skips already-quit results and returns the next non-quit candidate' do
        5.times { |i| create(:live_result, registration: registrations[i], round: round1, average: (i + 1) * 100) }

        # Rank 4 has quit; rank 5 is still a valid candidate
        rank4 = round1.live_results.order(global_pos: :asc).offset(3).first
        rank4.update!(quit_by_id: create(:user).id)

        next_qualifying = round2.next_participating_without(registrations.first)
        expect(next_qualifying.map(&:registration_id)).to contain_exactly(registrations[4].id)
      end
    end

    context 'with AttemptResultCondition where the 75% cap is the binding constraint' do
      # 4 results under 300 (100,200,250,280) but cap = floor(5*0.75) = 3
      # So rank 4 (280) doesn't advance despite being under the threshold
      let!(:round1) { create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition) }
      let!(:round2) { create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: attempt_result_condition, participation_source: round1) }

      it 'returns the person who meets the condition but was capped out' do
        averages = [100, 200, 250, 280, 310]
        5.times { |i| create(:live_result, registration: registrations[i], round: round1, average: averages[i]) }

        # ranks 1,2,3 advance (capped). rank 4 (280) meets condition but was capped out.
        # With rank 1 removed: pool=4, under-300 = 200,250,280 = 3, cap=3 → rank 4 qualifies
        next_qualifying = round2.next_participating_without(registrations.first)
        expect(next_qualifying.map(&:registration_id)).to contain_exactly(registrations[3].id)
      end

      it 'returns empty when the next person exceeds the time threshold' do
        averages = [100, 200, 250, 310, 400]
        5.times { |i| create(:live_result, registration: registrations[i], round: round1, average: averages[i]) }

        # ranks 1,2,3 advance (all under 300, not capped). rank 4 (310) is over threshold.
        # With rank 1 removed: pool=4, under-300 = 200,250 = 2, cap=3 → only 2 advance
        # Ranks 2 and 3 are already advancing — no new person qualifies
        expect(round2.next_participating_without(registrations.first)).to eq([])
      end
    end
  end
end
