# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  self.table_name = "InboxResults"

  # NOTE: don't use these too often, as it triggers one person load per call!
  # If you need names for a batch of InboxResult, consider joining the InboxPerson table.
  def person
    InboxPerson.find_by(id: personId, competitionId: competitionId)
  end

  def personName # rubocop:disable Naming/MethodName
    person&.name || "<personId=#{personId}>"
  end
end
