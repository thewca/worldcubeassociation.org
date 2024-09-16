# frozen_string_literal: true

class PublishRegistrationMetrics < WcaCronjob
  before_enqueue do
    # This information is not useful for us in staging
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  def record_last_60_minutes_registrations
    count = Registration.where(created_at: 60.minutes.ago..).count
    ::NewRelic::Agent.record_metric('Custom/Registrations/last60Minutes-registrations', count)
  end

  def record_next_60_minutes_bookmarks
    count = Competition.where(registration_open: Time.now.utc..60.minutes.from_now).sum(&:number_of_bookmarks)
    ::NewRelic::Agent.record_metric('Custom/Registrations/next60Minutes-Bookmarks', count)
  end

  def record_next_60_minutes_openings
    count = Competition.where(registration_open: Time.now.utc..60.minutes.from_now).count
    ::NewRelic::Agent.record_metric('Custom/Registrations/next60Minutes-registration-openings', count)
  end

  def record_next_60_minutes_competitor_limits
    total_limit = Competition.where(registration_open: Time.now.utc..60.minutes.from_now).sum(:competitor_limit)
    ::NewRelic::Agent.record_metric('Custom/Registrations/next60Minutes-limit', total_limit)
  end

  def perform
    record_last_60_minutes_registrations
    record_next_60_minutes_bookmarks
    record_next_60_minutes_openings
    record_next_60_minutes_competitor_limits
  end
end
