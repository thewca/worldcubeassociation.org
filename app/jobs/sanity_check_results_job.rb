# frozen_string_literal: true

class SanityCheckResultsJob < ApplicationJob
  # We want to make sure this runs not in parallel but after the sanity checks
  queue_as :sanity_checks

  def perform(email_to)
    SanityCheckMailer.notify_of_sanity_check_results(email_to).deliver_later
  end
end
