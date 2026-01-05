# frozen_string_literal: true

class SanityCheckResultsJob < ApplicationJob
  # We want to make sure this runs not in parallel but after the sanity checks
  QUEUE_NAME = :wca_jobs
  def perform(email_to)
    WcaMonthlyDigestMailer.notify_of_sanity_check_results(email_to).deliver_later
  end
end
