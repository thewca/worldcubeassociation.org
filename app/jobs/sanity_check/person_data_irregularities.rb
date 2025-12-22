# frozen_string_literal: true

class SanityCheck::PersonDataIrregularities < SanityCheck::SanityCheckJob
  def perform
    results = SanityCheckData::PersonDataIrregularities::QUERIES.map do |query_info|
      query_results = ActiveRecord::Base.connection.exec_query query_info[:query]
      query_info[:results] = query_results
    end
    self.class.sanity_check_statistics.update(result: results.to_json)
  end

  class << self
    def sanity_check_category_id
      1
    end
  end
end
