# frozen_string_literal: true

class CheckRegionalRecordsForm
  include ActiveModel::Model

  attr_accessor :competition_id, :event_id, :refresh_index

  def check_event_id
    self.event_id == 'all' ? nil : self.event_id
  end

  def refresh_index?
    ActiveRecord::Type::Boolean.new.cast(self.refresh_index) || false
  end

  def run_check
    CheckRegionalRecords.add_to_lookup_table(self.competition_id) if self.refresh_index? && self.competition_id.present?

    CheckRegionalRecords.check_records(self.check_event_id, self.competition_id)
  end

  def run_check_new
    CheckRegionalRecords.check_records_new_table(self.check_event_id, self.competition_id)
  end
end
