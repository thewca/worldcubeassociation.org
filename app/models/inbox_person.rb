# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  self.table_name = "InboxPersons"

  belongs_to :person, -> { current }, foreign_key: "wcaId", primary_key: "wca_id", optional: true

  alias_attribute :wca_id, :wcaId
  alias_attribute :ref_id, :id
  alias_attribute :competition_id, :competitionId

  alias_method :wca_person, :person

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

  # NOTE: silly method overriding: we don't have an id on that table.
  # Hopefully this necessary dirty hack will go away when we streamline posting
  # results through WCIF.
  def delete
    InboxPerson.where(id: id, competitionId: competitionId).delete_all
  end

  def update(args)
    InboxPerson.where(id: id, competitionId: competitionId).update_all(args)
  end
end
