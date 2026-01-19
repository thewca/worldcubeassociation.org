# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  # see result.rb for explanation of the scope
  belongs_to :inbox_person, foreign_key: %i[person_id competition_id], optional: true

  delegate :country_iso2, to: :inbox_person
  delegate :wca_id, to: :inbox_person

  alias_method :person, :inbox_person

  def person_name
    inbox_person&.name || "<person_id=#{person_id}>"
  end

  alias_method :name, :person_name

  def attempts
    self.legacy_attempts
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[attempts name country_iso2 wca_id],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
