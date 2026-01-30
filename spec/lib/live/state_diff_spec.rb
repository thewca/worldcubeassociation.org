# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Live::Helper do
  let(:competition) { create(:competition, event_ids: ["333"]) }
  let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

  context "Round Diff" do
    let(:round) { create(:round, event_id: "333", number: 1, competition: competition) }

    it 'broadcasts diff to ActionCable' do
      registration_1 = registrations.first
      round.init_round
      result = round.live_results.find_by!(registration_id: registration_1.id)
      expect {
        result.update(best: 100)
      }.to have_broadcasted_to(WcaLive.broadcast_key(round.id))
             .from_channel(ApplicationCable::Channel)
    end

    it 'correct diff for new results' do
      registration_1 = registrations.first
      round.init_round

      result = round.live_results.find_by!(registration_id: registration_1.id)

      before_hash = round.live_state

      attempts = 5.times.map.with_index(1) do |r, i|
        LiveAttempt.build_with_history_entry(( r + 1) * 100, i, User.first)
      end
      average, best = LiveResult.compute_average_and_best(attempts, round)
      result.update!(live_attempts: attempts, best: best, average: average)

      after_hash = round.live_state

      diff = Live::Helper.round_state_diff(before_hash, after_hash)

      expect(diff["updates"]).to contain_exactly({
                                                   "registration_id" => 1,
                                                   "advancing_questionable" => true,
                                                   "average" => average,
                                                   "best" => best,
                                                   "global_pos" => 1,
                                                   "local_pos" => 1,
                                                   "live_attempts" => attempts.map { it.serializable_hash({ only: %i[id value attempt_number] }) }
                                                 })
    end
  end
end
