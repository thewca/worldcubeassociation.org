# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  def self.in_progress?
    Delayed::Job.exists?(["handler LIKE ?", "%job_class: #{self.name}%"])
  end
end
