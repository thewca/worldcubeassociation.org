# frozen_string_literal: true

class ComputeLinkings < ApplicationJob
  queue_as :default

  def perform
    last_computation = Timestamp.find_or_create_by(name: 'linkings_computation')
    if last_computation.date.nil? || last_computation.date < 3.days.ago
      Relations.compute_linkings
      last_computation.touch :date
    end
  end
end
