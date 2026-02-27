# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  # for some reason, the ActiveRecord plural for "Person" is "people"…
  self.table_name = 'inbox_persons'

  # For historic reasons, we insert the registrant ID as the SQL table `id` column.
  #   These IDs are only unique per competition however, so we use a composite foreign key.
  self.primary_key = %i[id competition_id]

  belongs_to :person, -> { current }, foreign_key: "wca_id", primary_key: "wca_id", optional: true
  belongs_to :country, foreign_key: "country_iso2", primary_key: "iso2"
  has_one :registration, foreign_key: %i[registrant_id competition_id], primary_key: %i[id competition_id]

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

  def registration_mismatches
    return [] unless registration

    mismatches = []
    mismatches << "name ('#{name}' vs '#{registration.name}')" if name != registration.name
    mismatches << "country ('#{country_iso2}' vs '#{registration.country_iso2}')" if country_iso2 != registration.country_iso2
    mismatches << "gender ('#{gender}' vs '#{registration.gender}')" if gender != registration.gender
    mismatches << "dob ('#{dob}' vs '#{registration.dob}')" if dob.to_s != registration.dob&.to_s

    # inbox_persons.wca_id has a DB default of "" (never nil), while users.wca_id is nullable.
    # .presence normalizes both to nil.
    person_wca_id = wca_id.presence
    registration_wca_id = registration.wca_id.presence
    mismatches << "WCA ID ('#{person_wca_id}' vs '#{registration_wca_id}')" if person_wca_id != registration_wca_id

    mismatches
  end
end
