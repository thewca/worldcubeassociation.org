# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId, optional: true
  alias_attribute :person_name, :personName
  validates :personName, presence: true
  alias_attribute :person_id, :personId
  alias_attribute :person_name, :personName
  belongs_to :country, foreign_key: :countryId
  alias_attribute :country_id, :countryId
  has_one :continent, through: :country
  delegate :continent_id, :continent, to: :country
  # InboxPerson IDs are only unique per competition. So in addition to querying the ID itself (which is guaranteed by :foreign_key)
  # we also need sure to query the correct competition as well through a custom scope.
  belongs_to :inbox_person, ->(res) { where(competitionId: res.competitionId) }, primary_key: :id, foreign_key: :personId, optional: true

  MARKERS = [nil, "NR", "ER", "WR", "AfR", "AsR", "NAR", "OcR", "SAR"].freeze

  validates_inclusion_of :regionalSingleRecord, in: MARKERS
  validates_inclusion_of :regionalAverageRecord, in: MARKERS
  alias_attribute :regional_single_record, :regionalSingleRecord
  alias_attribute :regional_average_record, :regionalAverageRecord

  def country
    Country.c_find(self.countryId)
  end

  # If saving changes to personId, make sure that there is no results for
  # that person yet for the round.
  validate :unique_result_per_round, if: lambda {
    will_save_change_to_personId? || will_save_change_to_competitionId? || will_save_change_to_eventId? || will_save_change_to_roundTypeId?
  }

  def unique_result_per_round
    has_result = Result.where(competitionId: competitionId,
                              personId: personId,
                              eventId: eventId,
                              roundTypeId: roundTypeId).any?
    errors.add(:personId, "this WCA ID already has a result for that round") if has_result
  end

  scope :final, -> { where(roundTypeId: RoundType.final_rounds.map(&:id)) }
  scope :succeeded, -> { where("best > 0") }
  scope :average_succeeded, -> { where("average > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("events.rank") }
  scope :before, ->(date) { joins(:competition).where("end_date < ?", date) }
  scope :single_better_than, ->(time) { where("best < ? AND best > 0", time) }
  scope :average_better_than, ->(time) { where("average < ? AND average > 0", time) }
  scope :in_event, ->(event_id) { where(eventId: event_id) }

  alias_attribute :name, :personName
  alias_attribute :wca_id, :personId

  def attempts
    [value1, value2, value3, value4, value5]
  end

  def country_iso2
    country.iso2
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "pos", "best", "best_index", "worst_index", "average"],
    methods: ["name", "country_iso2", "competition_id", "event_id",
              "round_type_id", "format_id", "wca_id", "attempts", "best_index",
              "worst_index", "regional_single_record", "regional_average_record"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
