# frozen_string_literal: true

class CheckRegionalRecordsForm
  include ActiveModel::Model

  attr_accessor :competition_id, :event_id

  def check_event_id
    self.event_id == 'all' ? nil : self.event_id
  end

  def run_check
    CheckRecordsJob.perform_later(self.competition_id, self.check_event_id)
  end
end
