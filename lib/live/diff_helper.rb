# frozen_string_literal: true

module Live
  module DiffHelper
    # This method does not call round.live_results.reset so make sure to
    # change live_results only directly through the round associations, never through LiveResult.(...)
    # or reset yourself if you do
    def self.broadcast_changes(round, &)
      before_state = round.to_live_state

      result = yield

      after_state = round.to_live_state

      diff = self.compressed_round_state_diff(before_state, after_state, round)

      # Queues the broadcast — fires after outermost transaction commits,
      # or immediately if not inside a transaction. Never fires on rollback.
      ActiveRecord.after_all_transactions_commit do
        ActionCable.server.broadcast(Live::Config.broadcast_key(round.competition_id, round.wcif_id), diff)
      end

      result
    end

    def self.compressed_round_state_diff(before_state, after_state, round)
      diff = self.round_state_diff(before_state, after_state)
      diff = self.add_forecast_stats(diff, round)

      created_with_user = Array.wrap(diff["created"]).map { compress_payload(it).merge({ user: Registration.find(it["registration_id"]).to_live_json }) }

      {
        "updated" => Array.wrap(diff["updated"]).map { compress_payload it },
        "deleted" => diff["deleted"],
        "created" => created_with_user,
        'before_hash' => state_hash(before_state),
        'after_hash' => state_hash(after_state),
      }.compact_blank
    end

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

    COMPRESSION_MAP = {
      "advancing" => "ad",
      "advancing_questionable" => "adq",
      "average" => "a",
      "best" => "b",
      "average_record_tag" => "art",
      "single_record_tag" => "srt",
      "registration_id" => "r",
      "live_attempts" => "la",
      "value" => "v",
      "attempt_number" => "an",
      "best_possible_average" => "bpa",
      "worst_possible_average" => "wpa",
      "last_attempt_entered_at" => "at",
    }.freeze

    # To send even less data, we shorten the quite long attribute names
    def self.compress_payload(diff)
      diff.deep_transform_keys { COMPRESSION_MAP.fetch(it, it) }
    end

    def self.add_forecast_stats(diff, round)
      diff.merge("updated" => Array.wrap(diff["updated"]).map { forecast_for(it, round) }).compact_blank
    end

    def self.forecast_for(updated_result, round)
      return updated_result if updated_result["live_attempts"].nil? || updated_result["live_attempts"].length == round.format.expected_solve_count

      updated_result.merge(LiveResult.compute_best_and_worse_possible_average(updated_result["live_attempts"], round))
    end
  end
end
