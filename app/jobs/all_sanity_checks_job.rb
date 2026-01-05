# frozen_string_literal: true

class AllSanityChecksJob < WcaCronjob
  def perform
    SanityCheckCategory.find_each do |sanity_check_category|
      SanityCheckCategoryJob.perform_later(sanity_check_category)
    end
    # Enqueue Results job after, these are run on a single thread one after another
    SanityCheckCategory.select(:email_to).uniq.each do |email_to|
      SanityCheckResultsJob.perform_later(email_to)
    end
  end
end
