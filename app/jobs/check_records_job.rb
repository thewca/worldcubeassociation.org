# frozen_string_literal: true

class CheckRecordsJob < ApplicationJob
  before_enqueue do |job|
    result = CheckRecordsResult.find_by!(competition_id: job.arguments[0], event_id: job.arguments[1])
    result.update_column :run_start, Time.now.utc
  end

  after_perform do |job|
    result = CheckRecordsResult.find_by!(competition_id: job.arguments[0], event_id: job.arguments[1])
    result.update_column :run_end, Time.now.utc
  end

  queue_as :check_records
  def perform(competition_id, event_id)
    results = CheckRegionalRecords.check_records(event_id, competition_id)
    result = CheckRecordsResult.find_by!(competition_id: competition_id, event_id: event_id)
    result.update_column :results, results
  end
end
