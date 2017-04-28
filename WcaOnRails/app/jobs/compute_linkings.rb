# frozen_string_literal: true

class ComputeLinkings < ApplicationJob
  queue_as :default

  def computation_needed
    # Compute the linkings table for the relations feature whenever results are updated.
    Result.maximum(:updated_at) > 1.hour.ago
  end

  def perform
    Relations.compute_linkings if computation_needed
  end
end
