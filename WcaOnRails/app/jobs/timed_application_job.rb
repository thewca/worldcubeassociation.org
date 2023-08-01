# frozen_string_literal: true

module TimedApplicationJob
  extend ActiveSupport::Concern

  def queued_timestamp
    Timestamp.find_or_create_by!(name: "#{self.name.underscore}_queued")
  end

  def start_timestamp
    Timestamp.find_or_create_by!(name: "#{self.name.underscore}_start")
  end

  def end_timestamp
    Timestamp.find_or_create_by!(name: "#{self.name.underscore}_end")
  end

  def queued_date
    queued_timestamp.date
  end

  def start_date
    start_timestamp.date
  end

  def end_date
    end_timestamp.date
  end

  def in_queue?
    queued_date.present? && start_date.nil?
  end

  def in_progress?
    start_date.present? && end_date.nil?
  end

  def finished?
    end_date.present?
  end

  included do
    after_enqueue do |job|
      # When queued, clears the start and end timestamps, and updates the queued timestamp.
      job.class.queued_timestamp.touch :date
      job.class.start_timestamp.update! date: nil
      job.class.end_timestamp.update! date: nil
    end

    around_perform do |job, block|
      # When performing, updates the start timestamp.
      job.class.start_timestamp.touch :date
      job.class.end_timestamp.update! date: nil
      block.call
      job.class.end_timestamp.touch :date
    end
  end
end
