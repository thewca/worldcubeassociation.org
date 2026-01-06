# frozen_string_literal: true

class SanityCheckCategoryJob < WcaCronjob
  queue_as :sanity_checks

  def perform(sanity_check_category)
    sanity_check_category.sanity_checks.find_each do |sanity_check|
      query_result = ActiveRecord::Base.connection.exec_query sanity_check.query

      sanity_check.sanity_check_results.create!(
        query_results: query_result,
      )
    end
  end

  def instance_cronjob_statistics
    category_name = self.arguments.first.name
    self.class.cronjob_statistics(category_name)
  end
end
