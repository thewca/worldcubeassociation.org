# frozen_string_literal: true

class ComputeAuxiliaryData < TimedApplicationJob
  queue_as :default

  def perform
    AuxiliaryDataComputation.compute_everything
  end
end
