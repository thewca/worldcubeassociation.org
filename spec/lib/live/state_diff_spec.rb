# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Live::DiffHelper do
  let(:competition) { create(:competition, event_ids: ["333"]) }
  let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

  context "Round Diff" do
    let(:round) { create(:round, event_id: "333", number: 1, competition: competition) }

    it 'correct diff for new results' do
      registration_1 = registrations.first
      round.open_round!

      result = round.live_results.find_by!(registration_id: registration_1.id)

      before_state = round.to_live_state

      attempts = 5.times.map.with_index(1) do |r, i|
        LiveAttempt.build_with_history_entry((r + 1) * 100, i, User.first)
      end
      average, best = LiveResult.compute_average_and_best(attempts, round)
      result.update!(live_attempts: attempts, best: best, average: average)

      round.live_results.reload
      after_state = round.to_live_state

      diff = Live::DiffHelper.round_state_diff(before_state, after_state)

      expect(diff["updated"]).to contain_exactly({
                                                   "registration_id" => registration_1.id,
                                                   "advancing_questionable" => true,
                                                   "average" => average,
                                                   "best" => best,
                                                   "live_attempts" => attempts.map { it.serializable_hash({ only: %i[value attempt_number] }) },
                                                 })
      expect(diff["deleted"]).to be_nil
      expect(diff["created"]).to be_nil
      expect(diff["before_hash"]).to eq Live::DiffHelper.state_hash(before_state)
      expect(diff["after_hash"]).to eq Live::DiffHelper.state_hash(after_state)
    end

    it 'correct diff for updated results' do
      registration_1 = registrations.first
      registration_2 = registrations.second
      round.open_round!

      result = round.live_results.find_by!(registration_id: registration_1.id)

      attempts = 5.times.map.with_index(1) do |r, i|
        LiveAttempt.build_with_history_entry((r + 1) * 200, i, User.first)
      end
      average, best = LiveResult.compute_average_and_best(attempts, round)
      result.update!(live_attempts: attempts, best: best, average: average)

      before_state = round.to_live_state
      result_2 = round.live_results.find_by!(registration_id: registration_2.id)

      attempts_2 = 5.times.map.with_index(1) do |r, i|
        LiveAttempt.build_with_history_entry((r + 1) * 100, i, User.first)
      end
      average, best = LiveResult.compute_average_and_best(attempts_2, round)
      result_2.update!(live_attempts: attempts_2, best: best, average: average)

      round.live_results.reload
      after_state = round.to_live_state

      diff = Live::DiffHelper.round_state_diff(before_state, after_state)

      expect(diff["updated"]).to contain_exactly({
                                                   "registration_id" => registration_2.id,
                                                   "advancing_questionable" => true,
                                                   "average" => average,
                                                   "best" => best,
                                                   "live_attempts" => attempts_2.map { it.serializable_hash({ only: %i[value attempt_number] }) },
                                                 })
      expect(diff["deleted"]).to be_nil
      expect(diff["created"]).to be_nil
      expect(diff["before_hash"]).to eq Live::DiffHelper.state_hash(before_state)
      expect(diff["after_hash"]).to eq Live::DiffHelper.state_hash(after_state)
    end
  end

  describe 'State Hash' do
    let(:round) { create(:round) }

    it 'produces consistent hash for same state' do
      state = round.to_live_state
      hash1 = Live::DiffHelper.state_hash(state)
      hash2 = Live::DiffHelper.state_hash(state)

      expect(hash1).to eq(hash2)
    end

    it 'produces different hash when state changes' do
      before_hash = Live::DiffHelper.state_hash(round.to_live_state)

      create(:live_result, round: round)
      round.reload

      after_hash = Live::DiffHelper.state_hash(round.to_live_state)

      expect(before_hash).not_to eq(after_hash)
    end

    it "has a compression key defined for each serialization attribute" do
      create(:live_result, round: round)
      keys = []
      round.to_live_state.first.deep_transform_keys { keys << it }
      expect(keys.uniq).to match_array(Live::DiffHelper::COMPRESSION_MAP.keys.map(&:to_s))
    end
  end
end
