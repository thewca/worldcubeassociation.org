# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  belongs_to :person, -> { current }, primary_key: :wca_id, optional: true, inverse_of: :results
  validates :person_name, presence: true
  belongs_to :country
  has_one :continent, through: :country
  delegate :continent_id, :continent, to: :country

  # InboxPerson IDs are only unique per competition. So in addition to querying the ID itself (which is guaranteed by :foreign_key)
  # we also need sure to query the correct competition as well through a composite key.
  belongs_to :inbox_person, foreign_key: %i[competition_id person_id], optional: true, inverse_of: :results
  belongs_to :newcomer_registration, class_name: "Registration", foreign_key: %i[competition_id person_id], primary_key: %i[competition_id registrant_id], optional: true, inverse_of: :newcomer_results

  has_many :result_attempts, inverse_of: :result, dependent: :destroy, autosave: true, index_errors: true
  validates_associated :result_attempts

  MARKERS = [nil, "NR", "ER", "WR", "AfR", "AsR", "NAR", "OcR", "SAR"].freeze

  validates :regional_single_record, inclusion: { in: MARKERS }
  validates :regional_average_record, inclusion: { in: MARKERS }

  def country
    Country.c_find(self.country_id)
  end

  validates :person_id, uniqueness: { scope: :round_id, message: "this WCA ID already has a result for that round" }

  scope :final, -> { joins(:round).merge(Round.final) }
  scope :succeeded, -> { where("best > 0") }
  scope :average_succeeded, -> { where("average > 0") }
  # A dual (linked) round stores one result row per round, so a competitor who took part in
  # both rounds appears twice with the same global_pos. Keep only their better solve so each
  # competitor shows up once. No-op for normal rounds (already one row per competitor).
  scope :merged_dual_rounds, lambda {
    best_per_person = select(:id).joins(:format).select(Arel.sql(<<~SQL.squish))
      ROW_NUMBER() OVER (
        PARTITION BY results.competition_id, results.event_id, results.person_id
        ORDER BY (CASE WHEN formats.sort_by = 'average' THEN results.average ELSE results.best END) <= 0,
                 (CASE WHEN formats.sort_by = 'average' THEN results.average ELSE results.best END) ASC,
                 results.best <= 0, results.best ASC, results.id ASC
      ) AS rn
    SQL
    where("results.id IN (SELECT id FROM (#{best_per_person.to_sql}) ranked WHERE rn = 1)")
  }
  scope :podium, -> { final.succeeded.where(global_pos: [1..3]).merged_dual_rounds }
  scope :winners, -> { final.succeeded.where(global_pos: 1).merged_dual_rounds.joins(:event).order("events.rank") }
  scope :before, ->(date) { joins(:competition).where(competition: { end_date: ...date }) }
  scope :on_or_before, ->(date) { joins(:competition).where(competition: { end_date: ..date }) }
  # Ruby ranges can't express an exclusive start: `date..` means `>= date`
  # For a strict `> date` we negate the inverse (`NOT <= date`) instead
  scope :after, ->(date) { joins(:competition).where.not(competition: { end_date: ..date }) }
  scope :on_or_after, ->(date) { joins(:competition).where(competition: { end_date: date.. }) }
  scope :single_better_than, ->(time) { where("best < ? AND best > 0", time) }
  scope :average_better_than, ->(time) { where("average < ? AND average > 0", time) }
  scope :in_event, ->(event_id) { where(event_id: event_id) }
  scope :unmerged_newcomers, -> { where("person_id REGEXP '^[0-9]+$'") }

  alias_attribute :name, :person_name
  alias_attribute :wca_id, :person_id

  delegate :iso2, to: :country, prefix: true
  delegate :short_name, :start_date, to: :competition, prefix: true
  delegate :ranking_mode, to: :round

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id round_id pos best best_index worst_index average],
    methods: %w[name country_iso2 competition_id event_id
                round_type_id format_id wca_id attempts best_index
                worst_index regional_single_record regional_average_record],
  }.freeze

  # Use when serializing results that belong to a Round object
  V1_ROUND_SERIALIZE_OPTIONS = {
    only: %w[id pos global_pos best average],
    methods: %w[wca_id name country_iso2 attempts regional_single_record regional_average_record],
  }.freeze

  # Shows a result in isolation, and so the competition-specific data is included
  V1_STANDALONE_SERIALIZE_OPTIONS = {
    only: V1_ROUND_SERIALIZE_OPTIONS[:only],
    methods: V1_ROUND_SERIALIZE_OPTIONS[:methods] |
             %w[competition_id competition_short_name competition_start_date
                event_id round_type_id format_id ranking_mode],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def self.unpack_attempt_attributes(attempt_values, **additional_attributes)
    attempt_values
      .map
      .with_index(1)
      .filter { |value, _n| value != SolveTime::SKIPPED_VALUE }
      .map do |value, n|
        { value: value, attempt_number: n, **additional_attributes }
    end
  end

  def self.augment_attempts(result_attrs, id_key: "id")
    result_ids = result_attrs.pluck(id_key).uniq

    result_attempts_by_result = ResultAttempt.where(result_id: result_ids)
                                             .group_by(&:result_id)
                                             .transform_values { it.sort_by(&:attempt_number).map(&:value) }

    result_attrs.map { it.merge(attempts: result_attempts_by_result[it[id_key]]) }
  end

  V1_STANDALONE_COLUMNS = {
    "id" => "results.id",
    "pos" => "results.pos",
    "global_pos" => "results.global_pos",
    "best" => "results.best",
    "average" => "results.average",
    "wca_id" => "results.person_id",
    "name" => "results.person_name",
    "regional_single_record" => "results.regional_single_record",
    "regional_average_record" => "results.regional_average_record",
    "competition_id" => "results.competition_id",
    "competition_short_name" => "competitions.cell_name",
    "competition_start_date" => "competitions.start_date",
    "event_id" => "results.event_id",
    "round_type_id" => "results.round_type_id",
    "format_id" => "results.format_id",
  }.freeze

  # Needed to compute the serialized values, but not serialized themselves.
  V1_STANDALONE_LOOKUP_COLUMNS = {
    "country_id" => "results.country_id",
    "round_id" => "results.round_id",
    "is_h2h_mock" => "rounds.is_h2h_mock",
    "linked_round_id" => "rounds.linked_round_id",
  }.freeze

  # Produces the same output as `as_json(V1_STANDALONE_SERIALIZE_OPTIONS)` plus `participated_matches`,
  # but plucks the columns instead of instantiating every result, which is several times faster
  # for people with thousands of results.
  def self.to_v1_standalone_json
    columns = V1_STANDALONE_COLUMNS.merge(V1_STANDALONE_LOOKUP_COLUMNS)
    rows = joins(:round, :competition).pluck(*columns.values.map { Arel.sql(it) })
                                      .map { columns.keys.zip(it).to_h }

    attempts_by_result_id = ResultAttempt.where(result_id: rows.pluck("id"))
                                         .pluck(:result_id, :attempt_number, :value)
                                         .group_by(&:first)
                                         .transform_values { it.to_h { |_, number, value| [number, value] } }

    h2h_round_ids = rows.filter { it["is_h2h_mock"] }.pluck("round_id")
    matches_by_round_and_wca_id = H2hMatch.where(round_id: h2h_round_ids)
                                          .joins(:users)
                                          .where(users: { wca_id: rows.pluck("wca_id").uniq })
                                          .select("h2h_matches.*", "users.wca_id AS competitor_wca_id")
                                          .preload(*H2hMatch::SERIALIZATION_INCLUDES, round: { results: { person: :user } })
                                          .order(:match_number)
                                          .group_by { [it.round_id, it.competitor_wca_id] }

    rows.map do |row|
      row.except(*V1_STANDALONE_LOOKUP_COLUMNS.keys).merge(
        "country_iso2" => Country.c_find(row["country_id"]).iso2,
        "attempts" => attempts_from_hash(attempts_by_result_id.fetch(row["id"], {})),
        "ranking_mode" => Round.ranking_mode_for(is_h2h_mock: row["is_h2h_mock"], is_linked: row["linked_round_id"].present?),
        "participated_matches" => matches_by_round_and_wca_id.fetch([row["round_id"], row["wca_id"]], []).as_json,
      )
    end
  end
end
