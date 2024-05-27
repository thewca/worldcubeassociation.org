# frozen_string_literal: true

module CacheAccess
  EXPIRATION_DEFAULT = 60.minutes

  # The Hydration block needs to return an array of hashes that have an 'id' field
  def self.hydrate_entities(key_prefix, ids, expires_in: EXPIRATION_DEFAULT, &hydration_block)
    stringified_ids = ids.map(&:to_s)

    keys = stringified_ids.map { |id| self.hydration_key(key_prefix, id) }

    cache_hits = Rails.cache.read_multi(*keys)

    cached_entities = cache_hits.values.map(&:deep_stringify_keys)
    cached_ids = cached_entities.pluck('id').compact.uniq

    uncached_ids = stringified_ids - cached_ids

    if uncached_ids.empty?
      # No need to call hydration function if we have cached all data
      cached_entities
    else
      # Get Data for all uncached ids
      uncached_entities = hydration_block.call(uncached_ids).map(&:deep_stringify_keys)

      # Write all new data into the cache
      hydrated_entries = uncached_entities.index_by do |item|
        self.hydration_key(key_prefix, item['id'])
      end

      Rails.cache.write_multi(hydrated_entries, expires_in: expires_in)

      cached_entities + uncached_entities
    end
  end

  private_class_method def self.hydration_key(prefix, id)
    "#{prefix}-#{id}"
  end
end
