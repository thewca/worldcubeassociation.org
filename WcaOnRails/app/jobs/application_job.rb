# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  WCA_QUEUE = :wca_jobs

  queue_as WCA_QUEUE

  class << self
    def job_statistics
      JobStatistic.find_or_create_by!(name: self.name)
    end

    def start_date
      self.job_statistics.run_start
    end

    def end_date
      self.job_statistics.run_end
    end

    def in_progress?
      self.job_statistics.enqueued_at.present?
    end

    def finished?
      self.end_date.present?
    end

    def start_not_after?(other_date)
      self.start_date.nil? || self.start_date < other_date
    end
  end
end
