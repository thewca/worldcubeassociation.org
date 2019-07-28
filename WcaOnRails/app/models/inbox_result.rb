# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  self.table_name = "InboxResults"

  # NOTE: don't use this too often, as it triggers one person load per call!
  # If you need names for a batch of InboxResult, consider joining the InboxPerson table.
  def personName # rubocop:disable Naming/MethodName
    InboxPerson.find_by(id: personId, competitionId: competitionId)&.name || "<personId=#{personId}>"
  end
end
