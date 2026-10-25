# frozen_string_literal: true

class PostResultsJob < ApplicationJob
  # The results queue is processed one job at a time, so this only runs once the current CAD run has finished.
  queue_as RESULTS_QUEUE_NAME

  def perform(competition, posting_user)
    # The competition may have changed while waiting for CAD, for example if the results were posted in the meantime.
    return if CompetitionResultsImport.post_results_error(competition).present?

    CompetitionResultsImport.post_results(competition, posting_user)
  end
end
