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
  belongs_to :inbox_person, foreign_key: %i[person_id competition_id], optional: true, inverse_of: :results

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
  scope :single_better_than, ->(time) { where("best < ? AND best > 0", time) }
  scope :average_better_than, ->(time) { where("average < ? AND average > 0", time) }
  scope :in_event, ->(event_id) { where(event_id: event_id) }

  alias_attribute :name, :person_name
  alias_attribute :wca_id, :person_id

  delegate :iso2, to: :country, prefix: true

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id round_id pos best best_index worst_index average],
    methods: %w[name country_iso2 competition_id event_id
                round_type_id format_id wca_id attempts best_index
                worst_index regional_single_record regional_average_record],
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
end
