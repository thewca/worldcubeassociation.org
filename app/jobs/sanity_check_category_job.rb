# frozen_string_literal: true

class SanityCheckCategoryJob < WcaCronjob
  def self.prepare_task(category_name)
    self.set(tag: category_name.underscore)
  end

  def perform(sanity_check_category_id)
    SanityCheck.where(sanity_check_category_id: sanity_check_category_id) do |sanity_check|
      query_result = ActiveRecord::Base.connection.exec_query sanity_check.query
      SanityCheckResult.create!(sanity_check_id: sanity_check.id,
                                query_results: query_result,
                                cronjob_statistic_id: self.class.cronjob_statistics.id)
    end
  end
end
