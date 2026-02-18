# frozen_string_literal: true

module Live
  module DiffHelper
    def self.round_state_diff(before_state, after_state)
      before_hash = before_state.index_by { |r| r["registration_id"] }
      after_hash = after_state.index_by { |r| r["registration_id"] }

      {
        "updated" => compute_updated(before_hash, after_hash),
        "deleted" => compute_deleted(before_hash, after_hash),
        "created" => compute_created(before_hash, after_hash),
        'before_hash' => state_hash(before_state),
        'after_hash' => state_hash(after_state),
      }.compact_blank
    end

    def self.compute_updated(before_hash, after_hash)
      after_hash.filter_map do |id, after_result|
        before_result = before_hash[id]
        next unless before_result

        LiveResult.compute_diff(before_result, after_result).presence
      end.presence
    end

    def self.compute_deleted(before_hash, after_hash)
      (before_hash.keys - after_hash.keys).presence
    end

    def self.compute_created(before_hash, after_hash)
      created_ids = after_hash.keys - before_hash.keys
      after_hash.slice(*created_ids).values.presence
    end

    def self.state_hash(live_state)
      Digest::SHA1.hexdigest(live_state.to_json)
    end

    def self.add_forecast_stats(diff, round)
      diff.merge("updated" => Array.wrap(diff["updated"]).map { forecast_for(it, round) }).compact_blank
    end

    def self.forecast_for(updated_result, round)
      return updated_result unless result["live_attempts"].length < round.format.expected_solve_count

      updated_result.merge(LiveResult.compute_best_and_worse_possible_average(updated_result["live_attempts"], round))
    end
  end
end
