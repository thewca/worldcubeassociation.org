# frozen_string_literal: true

module TimedApplicationJob
  extend ActiveSupport::Concern

  def start_timestamp
    Timestamp.find_or_create_by!(name: "#{self.name.underscore}_start")
  end

  def end_timestamp
    Timestamp.find_or_create_by!(name: "#{self.name.underscore}_end")
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

  included do
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
end
