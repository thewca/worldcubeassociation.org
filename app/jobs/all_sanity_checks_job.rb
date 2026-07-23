# frozen_string_literal: true

class AllSanityChecksJob < WcaCronjob
  before_enqueue do
    # Sanity checks do not need to run on staging
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  def perform
    grouped_by_email = SanityCheckCategory.all.group_by(&:email_to)

    grouped_by_email.each do |email_to, sanity_checks|
      sanity_checks.each do |sanity_check_category|
        SanityCheckCategoryJob.perform_now(sanity_check_category)
      end
      SanityCheckMailer.notify_of_sanity_check_results(email_to).deliver_later
    end
  end
end
