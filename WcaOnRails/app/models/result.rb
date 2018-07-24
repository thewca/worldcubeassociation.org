# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  # FIXME: shouldn't we take advantage of the fact that these are cached?
  belongs_to :country, foreign_key: :countryId
  validates :country, presence: true

  scope :final, -> { where(roundTypeId: RoundType.final_rounds.map(&:id)) }
  scope :succeeded, -> { where("best > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  # NOTE: we have 'event' as a method using cached event in Resultable, so we use a different association just for this scope.
  belongs_to :events_table, class_name: "Event", foreign_key: :eventId
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:events_table).order("Events.rank") }
end
