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

    COMPRESSION_MAP = {
      "advancing" => "ad",
      "advancing_questionable" => "adq",
      "average" => "a",
      "best" => "b",
      "average_record_tag" => "art",
      "single_record_tag" => "srt",
      "registration_id" => "r",
      "live_attempts" => "la",
      "id" => "id",
      "value" => "v",
      "attempt_number" => "an",
    }

    # To send even less data, we shorten the quite long attribute names
    def self.compress_payload(diff)
      diff["created"] = compress_diff(diff["created"]) if diff["created"].present?
      diff["updated"] = compress_diff(diff["updated"]) if diff["updated"].present?
      diff
    end

    def self.compress_diff(diff)
      diff.map do |entry|
        entry["live_attempts"] = entry["live_attempts"].map { compress_keys(it) } if entry["live_attempts"].present?
        compress_keys(entry)
      end
    end

    def self.compress_keys(hash)
      hash.transform_keys do |key|
        COMPRESSION_MAP[key]
      end
    end
  end
end
