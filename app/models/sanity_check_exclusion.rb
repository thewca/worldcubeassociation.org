# frozen_string_literal: true

class SanityCheckExclusion < ApplicationRecord
  belongs_to :sanity_check

  serialize :exclusion, coder: JSON

  def excludes?(query_result)
    partially_equals?(exclusion, query_result)
  end

  # We have to do a partial equals here, as historically some of the exclusions have less
  # data than others
  def partially_equals?(exclusion_hash, query_result_hash)
    exclusion_hash.all? { |key, value| value == query_result_hash[key] }
  end
end
