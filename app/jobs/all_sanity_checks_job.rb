# frozen_string_literal: true

class AllSanityChecksJob < WcaCronjob
  def perform
    grouped_by_email = SanityCheckCategory.all.group_by(&:email_to)

    grouped_by_email.each do |email_to, sanity_checks|
      sanity_checks.each do |sanity_check_category|
        SanityCheckCategoryJob.perform_now(sanity_check_category)
      end
      SanityCheckResultsJob.perform_now(email_to)
    end
  end
end
