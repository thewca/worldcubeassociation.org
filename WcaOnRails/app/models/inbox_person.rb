# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  self.table_name = "InboxPersons"

  alias_attribute :wca_id, :wcaId

  validates :name, presence: true
  validates :dob, presence: true
  validates :countryId, presence: true

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, "must be in the past")
    end
  end

  def country
    Country.find_by_iso2(countryId)
  end
end
