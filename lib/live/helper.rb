# frozen_string_literal: true

module LiveResults
  module Helper
    def self.round_state_diff(before_state, after_state)
      before_hash = before_state.index_by { |r| r[:registration_id] }
      after_hash = after_state.index_by { |r| r[:registration_id] }

      {
        updated: compute_updated(before_hash, after_hash),
        deleted: compute_deleted(before_hash, after_hash),
        created: compute_created(before_hash, after_hash)
      }.compact_blank
    end

    def self.compute_updated(before_hash, after_hash)
      updates = []

      after_hash.each do |id, after_result|
        before_result = before_hash[id]
        next unless before_result # Skip new results

        result_diff = LiveResult.compute_diff(before_result, after_result)
        updates << result_diff if result_diff.present?
      end

      updates.presence
    end

    def self.compute_deleted(before_hash, after_hash)
      deleted_ids = before_hash.keys - after_hash.keys
      deleted_ids.presence
    end

    def self.compute_created(before_hash, after_hash)
      created_ids = after_hash.keys - before_hash.keys
      created = created_ids.map { |id| after_hash[id] }
      created.presence
    end
  end
end
