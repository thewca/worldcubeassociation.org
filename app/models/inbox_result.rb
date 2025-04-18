# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  self.table_name = "InboxResults"

  # see result.rb for explanation of the scope
  belongs_to :inbox_person, ->(ibr) { where(competition_id: ibr.competitionId) }, primary_key: :id, foreign_key: :personId, optional: true

  # NOTE: don't use these too often, as it triggers one person load per call!
  # If you need names for a batch of InboxResult, consider joining the InboxPerson table.
  def person
    InboxPerson.find_by(id: personId, competition_id: competitionId)
  end

  def personName # rubocop:disable Naming/MethodName
    inbox_person&.name || "<personId=#{personId}>"
  end
end
