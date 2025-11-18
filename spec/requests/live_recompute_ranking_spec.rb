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
      round = create(:round, competition: competition, event_id: "333bf", format_id: "3")

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
      round = create(:round, competition: competition, event_id: "333bf", format_id: "3")

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
      round = create(:round, competition: competition, event_id: "333bf", format_id: "3")

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
      round = create(:round, competition: competition, event_id: "333bf", format_id: "3")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round, registration: registration, best: (i + 1) * 100)
      end

      registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])
      create(:live_result, round: round, registration: registration, best: -2)

      expect(round.live_results.sort_by(&:best).pluck(:local_pos)).to eq [4, 1, 2, 3]
    end

    it "Ranks results correctly by single even with incomplete results present" do
      competition = create(:competition, event_ids: ["333bf"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333bf", format_id: "3")

      3.times do |i|
        registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])

        create(:live_result, round: round, registration: registration, best: (i + 1) * 100)
      end

      registration = create(:registration, :accepted, competition: competition, event_ids: ["333bf"])
      create(:live_result, round: round, registration: registration, best: 0)

      expect(round.live_results.sort_by(&:best).pluck(:local_pos)).to eq [nil, 1, 2, 3]
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
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round, number: 2)

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
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round)
      create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round, number: 2)

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
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round, number: 2)

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
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round, number: 2)

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
      round1 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333bf", format_id: "3", linked_round: linked_round, number: 2)

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
