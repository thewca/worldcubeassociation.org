# frozen_string_literal: true

class SingletonApplicationJob < ApplicationJob
  def self.in_progress?
    Delayed::Job.exists?(["handler LIKE ?", "%job_class: #{self.name}%"])
  end

  before_enqueue do |job|
    # Abort if job of the kind is already enqueued.
    throw :abort if job.class.in_progress?
  end
end
