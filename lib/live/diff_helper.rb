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
      compress_diff_keys(diff, created: { live_attempts: nil }, updated: { live_attempts: nil })
    end

    def self.compress_diff_keys(diff_hash, **nested_compressions)
      nested_keys = nested_compressions.stringify_keys.keys

      compressed_recursive = diff_hash.slice(*nested_keys).to_h do |diff_key, diff_val|
        recursive_compressions = nested_compressions.fetch(diff_key.to_sym, {})
        compressed_val = diff_val.map { compress_diff_keys(it, **recursive_compressions) }

        [diff_key, compressed_val]
      end

      compressed_values = diff_hash.except(*nested_keys).merge(compressed_recursive)
      compressed_values.transform_keys { COMPRESSION_MAP.fetch(it, it) }
    end
  end
end
