# frozen_string_literal: true

class InboxPerson < ApplicationRecord
  # for some reason, the ActiveRecord plural for "Person" is "people"…
  self.table_name = 'inbox_persons'

  belongs_to :person, -> { current }, foreign_key: "wca_id", primary_key: "wca_id", optional: true
  belongs_to :country, foreign_key: "country_iso2", primary_key: "iso2"

  alias_attribute :ref_id, :id
  alias_method :wca_person, :person

  # Compatibility layer for results posting code that doesn't care whether it's a real person or an inbox person
  # TODO: Get rid of this when we get rid of the inbox_* tables during results posting
  alias_attribute :country_id, :country_iso2

  # FIXME: GB Remove this after all other snake_case migrations are done
  alias_attribute :competitionId, :competition_id

  validates :name, presence: true
  validates :dob, presence: true
  validates :country_iso2, presence: true

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    errors.add(:dob, "must be in the past") if dob && dob >= Date.today
  end

  def country
    # We disable RuboCop because `find_by_iso2` is actually a manually created method
    #   by us that just "happens to" sound like a dynamic finder.
    Country.find_by_iso2(self.country_iso2) # rubocop:disable Rails/DynamicFindBy
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
