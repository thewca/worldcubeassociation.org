# frozen_string_literal: true

class ComputeAuxiliaryData < ApplicationJob
  queue_as :default

  def perform
    Timestamp.find_or_create_by(name: 'auxiliary_data_start').touch :date
    AuxiliaryDataComputation.compute_everything
    Timestamp.find_or_create_by(name: 'auxiliary_data_end').touch :date
  end
end
