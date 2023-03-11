# frozen_string_literal: true

class CheckRegionalRecordsForm
  include ActiveModel::Model

  attr_accessor :competition_id, :event_id

  def run_check
    check_event_id = event_id == 'all' ? nil : event_id

    CheckRegionalRecords.check_records(check_event_id, competition_id)
  end
end
