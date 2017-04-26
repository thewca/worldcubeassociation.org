# frozen_string_literal: true

class ComputeLinkings < ApplicationJob
  queue_as :default

  def computation_needed
    # Compute the linkings table for relations feature every three days.
    selected = ActiveRecord::Base.connection.execute <<-SQL
      SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_NAME='linkings'
    SQL
    relations_data_computation_date = selected.first[0]
    relations_data_computation_date < 3.days.ago
  end

  def perform
    Relations.compute_linkings if computation_needed
  end
end
