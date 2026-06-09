# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "Ranking Recomputation for standard rounds" do
    let!(:delegate) { create(:delegate) }

    it "Ranks results correctly by average" do
      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition)

        create(:live_result, round: round, registration: registration, average: (i + 1) * 100)
      end

      round.live_results.sort_by(&:average).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end
    end

    it "Ranks results correctly by single" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333bf", format_id: "5")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round, registration: registration, best: (i + 1) * 100)
      end

      round.live_results.sort_by(&:best).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end
    end

    it "Handles ties correctly if both best and average is the same" do
      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")

      3.times do |_i|
        registration = create(:registration, :accepted, competition: competition)

        create(:live_result, round: round, registration: registration, average: 100)
      end

      round.live_results.sort_by(&:average).each do |r|
        expect(r.local_pos).to eq 1
      end
    end

    it "Handles ties correctly single beats average if tied" do
      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition)

        create(:live_result, round: round, registration: registration, best: (i + 1) * 100)
      end

      round.live_results.sort_by(&:best).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end
    end

    it "Handles ties correctly average does not beat single ties" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333bf", format_id: "5")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round, registration: registration, best: 100, average: (i + 1) * 100)
      end

      round.live_results.each do |r|
        expect(r.local_pos).to eq 1
      end
    end

    it "Ranks results correctly by single even with DNFs present" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333bf", format_id: "5")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round, registration: registration, best: (i + 1) * 100)
      end

      registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])
      create(:live_result, round: round, registration: registration, best: -1)

      expect(round.live_results.sort_by(&:best).pluck(:local_pos)).to eq [4, 1, 2, 3]
    end

    it "Ranks results correctly by single even with DNSs present" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333bf", format_id: "5")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round, registration: registration, best: (i + 1) * 100)
      end

      registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])
      create(:live_result, round: round, registration: registration, best: -2)

      expect(round.live_results.sort_by(&:best).pluck(:local_pos)).to eq [4, 1, 2, 3]
    end

    it "Ranks results correctly for FMC with incomplete and DNF mean results present" do
      competition = create(:competition, event_ids: ["333fm"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333fm", format_id: "m")

      # Three complete results with valid means (25, 30, 35 moves)
      [[20, 25, 30], [25, 30, 35], [30, 35, 40]].each do |moves|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333fm"])
        live_result = LiveResult.create!(LiveResult.empty_result_attributes(registration.id, round.id))
        attempts = moves.each_with_index.map { |v, i| { attempt_number: i + 1, value: v } }
        UpdateLiveResultJob.perform_now(live_result, attempts, delegate.id)
      end

      # One result with only the first attempt entered (39 moves) — still competing, no mean yet
      registration = create(:registration, :accepted, competition: competition, event_ids: ["333fm"])
      live_result = LiveResult.create!(LiveResult.empty_result_attributes(registration.id, round.id))
      UpdateLiveResultJob.perform_now(live_result, [{ attempt_number: 1, value: 39 }], delegate.id)

      # One result with two valid attempts (40, 50) and one DNF — mean is DNF, best single is 40
      registration = create(:registration, :accepted, competition: competition, event_ids: ["333fm"])
      live_result = LiveResult.create!(LiveResult.empty_result_attributes(registration.id, round.id))
      UpdateLiveResultJob.perform_now(live_result, [
                                        { attempt_number: 1, value: 40 },
                                        { attempt_number: 2, value: 50 },
                                        { attempt_number: 3, value: -1 },
                                      ], delegate.id)

      # Expected ranking (sorted by best single, all positive in this test):
      # 1-3: the three people with complete means (best singles: 20, 25, 30)
      # 4: person with only one attempt entered (best=39) — ranks above DNF because 39 < 40
      # 5: person with DNF mean (best=40)
      # Both incomplete and DNF results have invalid means so they rank only by best single.
      expect(round.live_results.reload.sort_by(&:best).map(&:local_pos)).to eq [1, 2, 3, 4, 5]
    end
  end

  describe "Ranking Recomputation for linked rounds" do
    let!(:delegate) { create(:delegate) }
    let(:linked_round) { create(:linked_round) }

    it "Ranks results correctly by average if both rounds have results" do
      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition)

        create(:live_result, round: round1, registration: registration, average: (i + 1) * 100)
        create(:live_result, round: round2, registration: registration, average: ((i + 1) * 100) - 1)
      end

      round1.live_results.sort_by(&:average).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end

      round2.live_results.sort_by(&:average).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end

      round1.linked_round.merged_live_results.each.with_index(1) do |r, i|
        expect(r.global_pos).to eq i
        expect(r.round_id).to eq round2.id
      end
    end

    it "Ranks results correctly by average if only one round has results" do
      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333", linked_round: linked_round)
      create(:round, competition: competition, event_id: "333", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition)

        create(:live_result, round: round1, registration: registration, average: (i + 1) * 100)
      end

      round1.live_results.sort_by(&:average).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
        expect(r.global_pos).to eq i
      end
    end

    it "Ranks results correctly by single if both rounds have results" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round1, registration: registration, best: ((i + 1) * 100) - 1)
        create(:live_result, round: round2, registration: registration, best: (i + 1) * 100)
      end

      round1.live_results.sort_by(&:best).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end

      round2.live_results.sort_by(&:best).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
      end

      round1.linked_round.merged_live_results.each.with_index(1) do |r, i|
        expect(r.global_pos).to eq i
        expect(r.round_id).to eq round1.id
      end
    end

    it "Ranks results correctly by single if only one round has results" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round)
      create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round1, registration: registration, best: ((i + 1) * 100) - 1)
      end

      round1.live_results.sort_by(&:best).each.with_index(1) do |r, i|
        expect(r.local_pos).to eq i
        expect(r.global_pos).to eq i
      end
    end

    it "Ranks results correctly by single even with DNFs present in one of the rounds" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round1, registration: registration, best: (i + 1) * 100)
        create(:live_result, round: round2, registration: registration, best: -1)
      end

      round1.linked_round.merged_live_results.each.with_index(1) do |r, i|
        expect(r.global_pos).to eq i
        expect(r.round_id).to eq round1.id
      end
    end

    it "Ranks results correctly by single even with DNSs present in one of the rounds" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round1, registration: registration, best: (i + 1) * 100)
        create(:live_result, round: round2, registration: registration, best: -2)
      end

      round1.linked_round.merged_live_results.each.with_index(1) do |r, i|
        expect(r.global_pos).to eq i
        expect(r.round_id).to eq round1.id
      end
    end

    it "Ranks results correctly by single even with incomplete results present in one of the rounds" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "5", linked_round: linked_round, number: 2)

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round1, registration: registration, best: (i + 1) * 100)
        create(:live_result, round: round2, registration: registration, best: 0)
      end

      round1.linked_round.merged_live_results.each.with_index(1) do |r, i|
        expect(r.global_pos).to eq i
        expect(r.round_id).to eq round1.id
      end
    end
  end
end
