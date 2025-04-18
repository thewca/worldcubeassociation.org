# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  # see result.rb for explanation of the scope
  belongs_to :inbox_person, ->(ibr) { where(competition_id: ibr.competition_id) }, primary_key: :id, foreign_key: :person_id, optional: true

  # NOTE: don't use these too often, as it triggers one person load per call!
  # If you need names for a batch of InboxResult, consider joining the InboxPerson table.
  def person
    InboxPerson.find_by(id: person_id, competition_id: competition_id)
  end

  def person_name
    inbox_person&.name || "<person_id=#{person_id}>"
  end
end
