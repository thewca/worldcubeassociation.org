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

  PERSONAL_BEST_COLUMNS = %i[best average].freeze

  # Ids of the results whose single (`best`) or `average` tied or beat every earlier one in the same
  # event, oldest competition first, keyed by column. This is `ResultsHelper#historical_pb_markers`
  # ported to SQL, so that a page of results is judged against the person's whole history without loading it.
  def self.personal_best_ids_by_column
    # A result ties or beats every earlier one exactly when it equals the best so far including itself.
    # Comparing against the earlier results only would need a frame ending at `1 PRECEDING`, which
    # MySQL recomputes for every row instead of keeping a running minimum, several times slower.
    bests_so_far = PERSONAL_BEST_COLUMNS.map do |column|
      Arel.sql(<<~SQL.squish)
        MIN(CASE WHEN results.#{column} > 0 THEN results.#{column} END)
          OVER (PARTITION BY results.event_id ORDER BY competitions.start_date, results.id
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS #{column}_so_far
      SQL
    end

    personal_best_conditions = PERSONAL_BEST_COLUMNS.map { "results.#{it} = #{it}_so_far" }

    # Preloads don't matter for plucking ids, and an included association that is also joined
    # turns into an eager load, which would replace our `select`.
    ranked = except(:includes).joins(:competition).select(:id, *PERSONAL_BEST_COLUMNS, *bests_so_far)

    personal_best_rows = unscoped.from(ranked, :results)
                                 .where(personal_best_conditions.join(" OR "))
                                 .pluck(:id, :best, :best_so_far, :average, :average_so_far)

    {
      best: personal_best_rows.filter_map { |id, best, best_so_far, _, _| id if best == best_so_far }.to_set,
      average: personal_best_rows.filter_map { |id, _, _, average, average_so_far| id if average == average_so_far }.to_set,
    }
  end

  def self.augment_attempts(result_attrs, id_key: "id")
    result_ids = result_attrs.pluck(id_key).uniq

    result_attempts_by_result = ResultAttempt.where(result_id: result_ids)
                                             .group_by(&:result_id)
                                             .transform_values { it.sort_by(&:attempt_number).map(&:value) }

    result_attrs.map { it.merge(attempts: result_attempts_by_result[it[id_key]]) }
  end

  # Make sure to preload the relevant data when calling this method
  private def participated_matches
    return [] if person.user.nil?

    person.user.h2h_matches.filter { it.round_id == round_id }
  end
end
