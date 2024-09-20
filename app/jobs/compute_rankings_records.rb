# frozen_string_literal: true

class ComputeRankingsRecords < WcaCronjob
  def self.reason_not_to_run
    unless ComputeAuxiliaryData.last_run_successful?
      "The last CAD run was not successful, so there is no valid data to compute the public tables from."
    end
  end

  def perform
    RecordsRankingsComputation.compute_everything
  end
end
