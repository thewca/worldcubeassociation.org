# frozen_string_literal: true

class CheckRegionalRecordsForm
  include ActiveModel::Model

  attr_accessor :competition_id, :event_id

  def check_event_id
    self.event_id == 'all' ? nil : self.event_id
  end

  def run_check
    ActiveRecord::Base.connected_to(role: :read_replica) do
      CheckRegionalRecords.check_records(self.check_event_id, self.competition_id)
    end
  end
end
