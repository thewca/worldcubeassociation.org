# frozen_string_literal: true

class TimedApplicationJob < ApplicationJob
  class DeferJob < StandardError
    attr_reader :wait_time
    def initialize(wait_time)
      super("Delay the job by #{time} s")
      @wait_time = wait_time
    end
  end

  rescue_from(DeferJob) do |defer_job|
    retry_job wait: defer_job.wait_time
  end

  def defer_job_for(wait_time)
    raise DeferJob.new(wait_time)
  end

  class << self
    def start_timestamp
      Timestamp.find_or_create_by(name: "#{self.name.underscore}_start")
    end

    def end_timestamp
      Timestamp.find_or_create_by(name: "#{self.name.underscore}_end")
    end

    def start_date
      start_timestamp.date
    end

    def end_date
      end_timestamp.date
    end

    def in_progress?
      start_date.present? && end_date.nil?
    end

    def finished?
      end_date.present?
    end
  end

  after_enqueue do |job|
    # Reset the end timestamp so the job is no longer considered finished.
    job.class.end_timestamp.update! date: nil
  end

  around_perform do |job, block|
    job.class.start_timestamp.touch :date
    job.class.end_timestamp.update! date: nil
    block.call
    job.class.end_timestamp.touch :date
  end
end
