# frozen_string_literal: true

class ServerStatusController < ApplicationController
  def index
    @locale_stats = ApplicationController.locale_counts.sort_by { |locale, count| count }.reverse

    @checks = checks
    @everything_good = @checks.all?(&:is_passing?)
    if !@everything_good
      render status: 503
    end
  end

  def checks
    [
      JobsCheck.new,
      RegulationsCheck.new,
      CertificateCheck.new,
      StripeChargesCheck.new,
    ]
  end
end

class StatusCheck
  def is_passing?
    status == :success
  end

  def status_description
    # Computing the status may be expensive, in which case we don't want to do it
    # multiple times, so we memoize the result here.
    @status_description ||= self._status_description
  end

  def status
    status_description[0]
  end

  def description
    status_description[1]
  end
end

class JobsCheck < StatusCheck
  MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING = 5
  include ActionView::Helpers::DateHelper

  def label
    "Jobs"
  end

  protected def _status_description
    jobs_that_should_have_run_by_now = Delayed::Job.where(attempts: 0).where(locked_at: nil).where('created_at < ?', MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING.minutes.ago)
    oldest_job_that_should_have_run_by_now = jobs_that_should_have_run_by_now.order(:created_at).first

    if oldest_job_that_should_have_run_by_now.nil?
      [:success, nil]
    else
      [
        :danger,
        %{
          Uh oh!
          Job #{oldest_job_that_should_have_run_by_now.id} was created
          #{time_ago_in_words oldest_job_that_should_have_run_by_now.created_at}
          ago and still has not run.
          #{jobs_that_should_have_run_by_now.count}
          #{"job".pluralize(jobs_that_should_have_run_by_now.count)}
          #{"is".pluralize(jobs_that_should_have_run_by_now.count)}
          waiting to run.
        }.squish,
      ]
    end
  end
end

class RegulationsCheck < StatusCheck
  def label
    "Regulations"
  end

  protected def _status_description
    if Regulation.regulations_load_error.nil?
      [:success, nil]
    else
      [:danger, "Error while loading regulations: #{Regulation.regulations_load_error}"]
    end
  end
end

class CertificateCheck < StatusCheck
  CERTIFICATE_PATH = "#{Rails.root}/../secrets/https/#{URI.parse(ENVied.ROOT_URL).host}.chained.crt"
  # We want to be warned 10 days before certificate's renewal
  CERTIFICATE_RENEW_DELAY = 10

  def label
    "SSL Certificate"
  end

  protected def _status_description
    begin
      raw = File.read(CERTIFICATE_PATH)
    rescue Errno::ENOENT
      description = "No certificate to check! (certificate path is '#{CERTIFICATE_PATH}')"
      certificate_good = false
    else
      certificate = OpenSSL::X509::Certificate.new(raw)
      expires_in = (certificate.not_after.to_date - Time.now.to_date).to_i
      certificate_good = expires_in > CERTIFICATE_RENEW_DELAY
      description = if expires_in < 0
                      "Expired #{-expires_in} days ago!"
                    else
                      "Expires in #{expires_in} days."
                    end
    end

    # If we're in test or development, we don't want to go red on the SSL certificate.
    status = if Rails.env.test? || Rails.env.development? || certificate_good
               :success
             else
               :danger
             end

    [status, description]
  end
end

class StripeChargesCheck < StatusCheck
  def label
    "Stripe Charges"
  end

  protected def _status_description
    unknown_stripe_charges_count = StripeCharge.where(status: "unknown").count

    if unknown_stripe_charges_count == 0
      [:success, nil]
    else
      [:danger, "#{pluralize(unknown_stripe_charges_count, "Stripe charge")} with status 'unknown'."]
    end
  end
end
