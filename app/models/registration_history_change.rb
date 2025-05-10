# frozen_string_literal: true

class RegistrationHistoryChange < ApplicationRecord
  belongs_to :registration_history_entry

  def parsed_value
    if self.key == 'event_ids'
      # 'event_ids' are stored as JSON array.
      # TODO: Give every row the opportunity to mark for itself whether it is JSON-encoded or not
      JSON.parse(self.value)
    else
      self.value
    end
  end
end
