# frozen_string_literal: true

class ComputeAuxiliaryData < ApplicationJob
  queue_as :default

  def perform
    # Note: During the results posting process some results may be missing their corresponding WCA ID.
    #       If we detect that (means someone else is posting results at the moment), we defer the computation.
    if Result.exists?(personId: "")
      ComputeAuxiliaryData.set(wait: 10.minutes).perform_later
    else
      Timestamp.find_or_create_by(name: 'auxiliary_data_start').touch :date
      AuxiliaryDataComputation.compute_everything
      Timestamp.find_or_create_by(name: 'auxiliary_data_end').touch :date
    end
  end
end
