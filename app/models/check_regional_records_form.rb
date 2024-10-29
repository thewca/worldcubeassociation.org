# frozen_string_literal: true

class CheckRegionalRecordsForm
  include ActiveModel::Model

  attr_accessor :competition_id, :event_id, :refresh_index

  def check_event_id
    self.event_id == 'all' ? nil : self.event_id
  end

  def run_check
    if self.refresh_index && self.competition_id.present?
      CheckRegionalRecords.add_to_lookup_table(self.competition_id)
    end

    CheckRegionalRecords.check_records(self.check_event_id, self.competition_id)
  end
end
