# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  validates :personName, presence: true
  belongs_to :country, foreign_key: :countryId
  alias_attribute :country_id, :countryId
  has_one :continent, through: :country

  # NOTE: both nil and "" exist in the database, we may consider cleaning that up.
  MARKERS = [nil, "", "NR", "ER", "WR", "AfR", "AsR", "NAR", "OcR", "SAR"].freeze

  validates_inclusion_of :regionalSingleRecord, in: MARKERS
  validates_inclusion_of :regionalAverageRecord, in: MARKERS

  def country
    Country.c_find(self.countryId)
  end

  def continent
    country.continent
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
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("Events.rank") }
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

  def regional_single_record
    regionalSingleRecord || ""
  end

  def regional_average_record
    regionalAverageRecord || ""
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

  # as of 3-2023, the amount of competitions happening within 3 months can comfortably fit into memory.
  CHECK_RECORDS_INTERVAL = 3.months
  REGION_WORLD = '__World'

  def self.check_records(event_id, competition_id, value_column, value_type)
    competition_scope = Competition.order("start_date, id")

    if event_id.present?
      competition_scope = competition_scope.joins(:competition_events)
                                           .where(competition_events: { event_id: event_id })
    end

    if competition_id.present?
      model_competition = Competition.find(competition_id)
      competition_scope = competition_scope.where('end_date <= ?', model_competition.end_date)
    end

    records_registry = {}
    result_rows = []

    Competition.find_by_interval(CHECK_RECORDS_INTERVAL, competition_scope) do |comp|
      results_scope = comp.results

      if event_id.present?
        results_scope = results_scope.where(event_id: event_id)
      end

      ordered_results = results_scope.joins(:round_type)
                                     .order("RoundTypes.rank, #{value_column}")

      ordered_results.each do |r|
        value = r.send(value_column.to_sym)

        value_solve = r.send("#{value_column}_solve".to_sym)
        next if value_solve.incomplete?

        country_id = r.country_id
        continent_id = r.continent.id
        result_event_id = r.event_id

        calced_marker = nil

        records_registry[result_event_id] = {} unless records_registry.key? result_event_id
        event_records = records_registry[result_event_id]

        if !event_records.key?(country_id) || value <= event_records[country_id]
          calced_marker = 'NR'
          event_records[country_id] = value

          if !event_records.key?(continent_id) || value <= event_records[continent_id]
            continental_record_name = r.continent.record_name
            calced_marker = continental_record_name

            event_records[continent_id] = value

            if !event_records.key?(REGION_WORLD) || value <= event_records[REGION_WORLD]
              calced_marker = 'WR'
              event_records[REGION_WORLD] = value
            end
          end
        end

        computed_marker = r.send("regional#{value_type}Record".to_sym)

        if calced_marker.present? || computed_marker.present?
          relevant_result = if event_id.present? && competition_id.present?
                              r.event_id == event_id && r.competition_id == competition_id
                            elsif event_id.present?
                              r.event_id == event_id
                            elsif competition_id.present?
                              r.competition_id == competition_id
                            else
                              calced_marker != computed_marker
                            end

          if relevant_result
            result_rows.push({
                               calced_marker: calced_marker,
                               result: r
                             })
          end
        end
      end
    end

    result_rows
  end
end
