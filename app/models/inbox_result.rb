# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  # see result.rb for explanation of the scope
  belongs_to :inbox_person, ->(ibr) { where(competition_id: ibr.competition_id) }, primary_key: :id, foreign_key: :person_id, optional: true
  delegate :country_iso2, to: :person
  delegate :wca_id, to: :person

  # NOTE: don't use these too often, as it triggers one person load per call!
  # If you need names for a batch of InboxResult, consider joining the InboxPerson table.
  def person
    InboxPerson.find_by(id: person_id, competition_id: competition_id)
  end

  def person_name
    inbox_person&.name || "<person_id=#{person_id}>"
  end

  def name
    person_name
  end

  def attempts
    [value1, value2, value3, value4, value5]
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[attempts name country_iso2 wca_id],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
