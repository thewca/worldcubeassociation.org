# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  self.table_name = "InboxPersons"

  # FIXME: personId is uniquer per-competition, not globally in the table!
  #has_many :inbox_results, foreign_key: "personId"

  validates :name, presence: true
  validates :countryId, presence: true

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, "must be in the past")
    end
  end

  def country
    Country.c_find(countryId)
  end
end
