# frozen_string_literal: true

class ComputeAuxiliaryData < WcaCronjob
  def self.reason_not_to_run
    "Some results are missing their corresponding WCA ID, which means that someone hasn't finished submitting results." if Result.exists?(person_id: "")
  end

  def perform
    AuxiliaryDataComputation.compute_everything
  end
end
