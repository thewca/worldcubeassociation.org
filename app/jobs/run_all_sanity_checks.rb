# frozen_string_literal: true

class AllSanityChecksJob < WcaCronjob
  def perform
    SanityCheckCategory.find_each do |sanity_check_category|
      SanityCheckCategoryJob.perform_later(sanity_check_category)
    end
  end
end
