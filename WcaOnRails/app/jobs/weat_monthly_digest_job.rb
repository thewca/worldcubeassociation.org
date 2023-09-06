# frozen_string_literal: true

class WeatMonthlyDigestJob < WcaCronjob
  # Workaround until https://github.com/sidekiq-cron/sidekiq-cron/issues/418 is fixed
  def perform
    WcaMonthlyDigestMailer.send_weat_digest_content.deliver_later
  end
end
