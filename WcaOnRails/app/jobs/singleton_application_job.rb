# frozen_string_literal: true

class SingletonApplicationJob < ApplicationJob
  before_enqueue do |job|
    # Abort if job of the kind is already enqueued.
    already_enqueued = Delayed::Job.exists?(["handler LIKE ?", "%job_class: #{job.class.name}%"])
    throw :abort if already_enqueued
  end
end
