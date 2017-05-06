# frozen_string_literal: true

class TimedApplicationJob < ApplicationJob
  class DeferJob < StandardError
    attr_reader :time
    def initialize(time)
      super("Delay the job by #{time} s")
      @time = time
    end
  end

  rescue_from(DeferJob) do |defer_job|
    retry_job wait: defer_job.time
  end

  def defer_job_for(time)
    raise DeferJob.new(time)
  end

  def self.start_timestamp
    Timestamp.find_or_create_by(name: "#{self.name.underscore}_start")
  end

  def self.end_timestamp
    Timestamp.find_or_create_by(name: "#{self.name.underscore}_end")
  end

  def self.in_progress?
    self.start_timestamp.date.present? && self.end_timestamp.date.nil?
  end

  def self.finished?
    self.end_timestamp.date.present?
  end

  around_perform do |job, block|
    job.class.start_timestamp.touch :date
    job.class.end_timestamp.update! date: nil
    block.call
    job.class.end_timestamp.touch :date
  end

  def self.perform_later
    # Reset timestamps.
    self.end_timestamp.update! date: nil
    super
  end
end
