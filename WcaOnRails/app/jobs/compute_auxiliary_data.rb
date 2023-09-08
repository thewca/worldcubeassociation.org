# frozen_string_literal: true

class ComputeAuxiliaryData < WcaCronjob
  def self.reason_not_to_run
    if Result.exists?(personId: "")
      "Some results are missing their corresponding WCA ID, which means that someone hasn't finished submitting results."
    end
  end

  def perform
    AuxiliaryDataComputation.compute_everything
  end
end
