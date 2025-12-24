# frozen_string_literal: true

class SanityCheckCategoryJob < WcaCronjob
  def perform(options)
    sanity_check_category_id = options[:category_id]
    SanityCheck.where(sanity_check_category_id: sanity_check_category_id).find_each do |sanity_check|
      query_result = ActiveRecord::Base.connection.exec_query sanity_check.query
      SanityCheckResult.create!(sanity_check_id: sanity_check.id,
                                query_results: query_result,
                                cronjob_statistic_name: options[:name])
    end
  end
end
