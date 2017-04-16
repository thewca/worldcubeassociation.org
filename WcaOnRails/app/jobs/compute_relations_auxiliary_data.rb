# frozen_string_literal: true
class ComputeRelationsAuxiliaryData < ApplicationJob
  queue_as :default

  def computation_needed
    # Compute relations auxiliary data monthly.
    selected = ActiveRecord::Base.connection.execute <<-SQL
      SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_NAME='linkings'
    SQL
    relations_data_computation_date = selected.first[0]
    relations_data_computation_date < 1.month.ago
  end

  def perform
    Relations.compute_auxiliary_data if computation_needed
  end
end
