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
    # We do to_s as there are some exclusions in the database where ids are strings and some where ids are integers
    exclusion_hash.all? { |key, value| value.to_s == query_result_hash[key].to_s }
  end
end
