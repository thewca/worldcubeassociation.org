# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  belongs_to :country, foreign_key: :countryId
  validates :country, presence: true

  def country
    Country.c_find(self.countryId)
  end

  scope :final, -> { where(roundTypeId: RoundType.final_rounds.map(&:id)) }
  scope :succeeded, -> { where("best > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("Events.rank") }

  def serializable_hash(options = nil)
    {
      id: id,
      name: personName,
      country_iso2: country.iso2,
      competition_id: competitionId,
      pos: pos,
      event_id: eventId,
      round_type_id: roundTypeId,
      format_id: formatId,
      wca_id: personId,
      attempts: [value1, value2, value3, value4, value5],
      best: best,
      average: average,
      regional_single_record: regionalSingleRecord,
      regional_average_record: regionalAverageRecord,
    }
  end
end
