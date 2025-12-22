# frozen_string_literal: true

class SanityCheckCategoryJob < WcaCronjob
  def perform(sanity_check_category)
    results = sanity_check_category::QUERIES.map do |query_info|
      query_results = ActiveRecord::Base.connection.exec_query query_info[:query]
      query_info[:results] = query_results
      query_info
    end
    SanityCheckResult.create!(sanity_check_category_id: sanity_check_category::ID,
                               query_results: results.to_json,
                               cronjob_statistic_id: self.class.cronjob_statistics.id)
  end
end
