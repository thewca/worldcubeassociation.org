# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  # FIXME: shouldn't we take advantage of the fact that these are cached?
  belongs_to :country, foreign_key: :countryId
  validates :country, presence: true

  scope :final, -> { joins(:round_type).merge(RoundType.final_rounds) }
  scope :succeeded, -> { where("best > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("Events.rank") }
end
