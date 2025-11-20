# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  # for some reason, the ActiveRecord plural for "Person" is "people"…
  self.table_name = 'inbox_persons'

  # For historic reasons, we insert the registrant ID as the SQL table `id` column.
  #   These IDs are only unique per competition however, so we use a composite foreign key.
  self.primary_key = %i[id competition_id]

  belongs_to :person, -> { current }, foreign_key: "wca_id", primary_key: "wca_id", optional: true
  belongs_to :country, foreign_key: "country_iso2", primary_key: "iso2"

  alias_attribute :ref_id, :id
  alias_method :wca_person, :person

  # Compatibility layer for results posting code that doesn't care whether it's a real person or an inbox person
  # TODO: Get rid of this when we get rid of the inbox_* tables during results posting
  alias_attribute :country_id, :country_iso2

  validates :name, presence: true
  validates :dob, presence: true, comparison: { less_than: Date.today, message: "must be in the past" }
  validates :country_iso2, presence: true

  def country
    Country.c_find_by_iso2(self.country_iso2)
  end
end
