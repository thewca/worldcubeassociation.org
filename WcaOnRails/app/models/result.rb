# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  validates :personName, presence: true
  belongs_to :country, foreign_key: :countryId

  # NOTE: both nil and "" exist in the database, we may consider cleaning that up.
  MARKERS = [nil, "", "NR", "ER", "WR", "AfR", "AsR", "NAR", "OcR", "SAR"].freeze

  validates_inclusion_of :regionalSingleRecord, in: MARKERS
  validates_inclusion_of :regionalAverageRecord, in: MARKERS

  def country
    Country.c_find(self.countryId)
  end

  # If saving changes to personId, make sure that there is no results for
  # that person yet for the round.
  validate :unique_result_per_round, if: -> do
    will_save_change_to_personId? || will_save_change_to_competitionId? || will_save_change_to_eventId? || will_save_change_to_roundTypeId?
  end
  def unique_result_per_round
    has_result = Result.where(competitionId: competitionId,
                              personId: personId,
                              eventId: eventId,
                              roundTypeId: roundTypeId).any?
    if has_result
      errors.add(:personId, "this WCA ID already has a result for that round")
    end
  end

  scope :final, -> { where(roundTypeId: RoundType.final_rounds.map(&:id)) }
  scope :succeeded, -> { where("best > 0") }
  scope :average_succeeded, -> { where("average > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("Events.rank") }
  scope :before, lambda { |date|
    joins(:competition).where("end_date < ?", date)
  }
  scope :single_better_than, lambda { |time| where("best < ? AND best > 0", time) }
  scope :average_better_than, lambda { |time| where("average < ? AND average > 0", time) }
  scope :in_event, lambda { |event_id| where(eventId: event_id) }

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
      best_index: best_index,
      worst_index: worst_index,
      average: average,
      regional_single_record: regionalSingleRecord || "",
      regional_average_record: regionalAverageRecord || "",
    }
  end
end
