# frozen_string_literal: true

class ComputeAuxiliaryData < TimedApplicationJob
  queue_as :default

  def perform
    # Note: During the results posting process some results may be missing their corresponding WCA ID.
    #       If we detect that (means someone else is posting results at the moment), we defer the computation.
    if Result.exists?(personId: "")
      defer_job_for 1.minute
    else
      AuxiliaryDataComputation.compute_everything
    end
  end
end
