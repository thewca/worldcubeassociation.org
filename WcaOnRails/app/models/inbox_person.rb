# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  # for some reason, the ActiveRecord plural for "Person" is "people"…
  self.table_name = 'inbox_persons'

  belongs_to :person, -> { current }, foreign_key: "wca_id", primary_key: "wca_id", optional: true

  alias_attribute :ref_id, :id
  alias_attribute :wca_person, :person

  validates :name, presence: true
  validates :dob, presence: true
  validates :country_iso2, presence: true

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, "must be in the past")
    end
  end

  def country
    Country.find_by_iso2(country_iso2)
  end

  # NOTE: silly method overriding: we don't have an id on that table.
  # Hopefully this necessary dirty hack will go away when we streamline posting
  # results through WCIF.
  def delete
    InboxPerson.where(id: id, competition_id: competition_id).delete_all
  end

  def update(args)
    InboxPerson.where(id: id, competition_id: competition_id).update_all(args)
  end
end
