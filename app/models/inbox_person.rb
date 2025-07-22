# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  # for some reason, the ActiveRecord plural for "Person" is "people"…
  self.table_name = 'inbox_persons'

  # For historic reasons, we insert the registrant ID as the SQL table `id` column.
  #   These IDs are only unique per competition however, so we use a composite foreign key.
  self.primary_key = %i[id competition_id]

  def numeric_id
    # This is the "raw" ID directly from the database column.
    #   When calling `my_inbox_person.id` on the Rails model, you will receive an array
    #   as the return value, because of the `self.primary_key` override at the top of the file.
    # In some contexts, we do want to access the raw ID however
    #   (most notably, in validators when comparing for equality)
    # Note also, that doing `self[:id]` is not the same as `self.id`!
    #   - The latter gives the Rails "smart-cast" composite ID (as an array in this case)
    #   - The former gives the _attribute_ called `id` directly from the raw database record
    self[:id]
  end

  belongs_to :person, -> { current }, foreign_key: "wca_id", primary_key: "wca_id", optional: true
  belongs_to :country, foreign_key: "country_iso2", primary_key: "iso2"

  alias_method :ref_id, :numeric_id
  alias_method :wca_person, :person

  # Compatibility layer for results posting code that doesn't care whether it's a real person or an inbox person
  # TODO: Get rid of this when we get rid of the inbox_* tables during results posting
  alias_attribute :country_id, :country_iso2

  validates :name, presence: true
  validates :dob, presence: true
  validates :country_iso2, presence: true

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    errors.add(:dob, "must be in the past") if dob && dob >= Date.today
  end

  def country
    Country.c_find_by_iso2(self.country_iso2)
  end
end
