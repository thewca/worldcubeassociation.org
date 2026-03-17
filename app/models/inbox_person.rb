# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  # for some reason, the ActiveRecord plural for "Person" is "people"…
  self.table_name = 'inbox_persons'

  # For historic reasons, we insert the registrant ID as the SQL table `id` column.
  #   These IDs are only unique per competition however, so we use a composite foreign key.
  self.primary_key = %i[id competition_id]

  belongs_to :person, -> { current }, foreign_key: "wca_id", primary_key: "wca_id", optional: true
  belongs_to :country, foreign_key: "country_iso2", primary_key: "iso2"
  belongs_to :registration, foreign_key: %i[competition_id id], primary_key: %i[competition_id registrant_id], optional: true, inverse_of: :inbox_person

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
    return [] unless registration.present?

    mismatch_checks = [:name, :country_iso2, :gender, :dob, :wca_id]
    mismatches = mismatch_checks.filter_map do |field|
      ibp_data = self.public_send(field).presence
      reg_data = registration.public_send(field).presence
      "#{I18n.t("activerecord.attributes.user.#{field}", locale: :en)} ('#{ibp_data}' VS '#{reg_data}')" if ibp_data != reg_data
    end
  end
end
