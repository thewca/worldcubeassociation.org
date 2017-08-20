# frozen_string_literal: true

class ServerStatusController < ApplicationController
  MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING = 5
  CERTIFICATE_PATH = "#{Rails.root}/../secrets/#{URI.parse(ENVied.ROOT_URL).host}"
  # We want to be warned 10 days before certificate's renewal
  CERTIFICATE_RENEW_DELAY = 10

  def index
    @everything_good = true

    @jobs_that_should_have_run_by_now = Delayed::Job.where(attempts: 0).where('created_at < ?', MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING.minutes.ago)
    @oldest_job_that_should_have_run_by_now = @jobs_that_should_have_run_by_now.order(:created_at).first
    @everything_good &&= @oldest_job_that_should_have_run_by_now.blank?

    @regulations_load_error = Regulation.regulations_load_error
    @everything_good &&= @regulations_load_error.blank?

    # We set @expires_in the following way:
    #  - if nil then no certificate was found
    #  - a positive integer indicates we have this number of days before expiration
    #  - a negative integer indicates it's expired by this number of days
    begin
      raw = File.read(CERTIFICATE_PATH)
      certificate = OpenSSL::X509::Certificate.new(raw)
      @expires_in = (certificate.not_after.to_date - Time.now.to_date).to_i
    rescue
      @expires_in = nil
    end
    # If we're in test or development, we don't want to go red on the SSL certificate.
    @certificate_good = Rails.env.test? || Rails.env.development? || (@expires_in || 0) > ServerStatusController::CERTIFICATE_RENEW_DELAY
    @everything_good &&= @certificate_good

    @locale_stats = ApplicationController.locale_counts.sort_by { |locale, count| count }.reverse

    if !@everything_good
      render status: 503
    end
  end
end
