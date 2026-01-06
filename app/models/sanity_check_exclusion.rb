# frozen_string_literal: true

class SanityCheckExclusion < ApplicationRecord
  belongs_to :sanity_check

  serialize :exclusion, coder: JSON

  def is_excluded?(query_result)
    partially_equals?(exclusion, query_result)
  end

  # We have to do a partial equals here, as historically some of the exclusions have less
  # data than others
  def partially_equals?(exclusion_hash, query_result_hash)
    exclusion_hash.each do |key, value|
      return false unless value.to_s == query_result_hash[key].to_s
    end

    true
  end
end
