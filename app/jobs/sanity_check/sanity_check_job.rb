# frozen_string_literal: true

class SanityCheck::SanityCheckJob < ApplicationJob
  QUEUE_NAME = :wca_jobs

  queue_as QUEUE_NAME

  before_enqueue do |job|
    statistics = job.class.sanity_check_statistics
    statistics.touch :enqueued_at
    statistics.save!
  end

  around_perform do |job, block|
    statistics = job.class.sanity_check_statistics

    statistics.touch :run_start

    statistics.run_end = nil
    statistics.enqueued_at = nil

    statistics.save!

    block.call
    statistics.touch :run_end
    statistics.increment :times_completed
    runtime = (statistics.run_end.to_f - statistics.run_start.to_f).in_milliseconds

    current_average = statistics.average_runtime || 0
    new_average = current_average + ((runtime - current_average) / statistics.times_completed)
    statistics.average_runtime = new_average.round
    statistics.save!
  end

  class << self
    delegate :in_progress?, :scheduled?, :enqueued_at, :finished?, :last_run_successful?, :last_error_message, :recently_errored?, to: :sanity_check_statistics

    def sanity_check_statistics
      SanityCheckStatistic.find_or_create_by!(id: self.sanity_check_category_id)
    end

    def start_date
      self.sanity_check_statistics.run_start
    end

    def end_date
      self.sanity_check_statistics.run_end
    end
  end
end
