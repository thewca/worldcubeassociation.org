# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  belongs_to :person, -> { current }, primary_key: :wca_id, optional: true
  validates :person_name, presence: true
  belongs_to :country
  has_one :continent, through: :country
  delegate :continent_id, :continent, to: :country

  # InboxPerson IDs are only unique per competition. So in addition to querying the ID itself (which is guaranteed by :foreign_key)
  # we also need sure to query the correct competition as well through a composite key.
  belongs_to :inbox_person, foreign_key: %i[person_id competition_id], optional: true

  has_many :result_attempts, dependent: :destroy, autosave: true, index_errors: true
  validates_associated :result_attempts

  # This is a hack because in our test suite we do `update!(valueN: 123)` lots of times
  #   to mock different result submission scenarios. Unfortunately, this can only be changed
  #   and "harmonized" once `inbox_results` is gone, because that still relies on valueNs.
  before_validation :backlink_attempts, on: :update, if: -> { Rails.env.test? }

  def backlink_attempts
    (1..5).each do |n|
      legacy_value = self.attributes["value#{n}"]

      # Crucially, `find_or_initialize_by` does NOT work here, because it circumvents Rails memory
      #   by going directly down to the database layer. `autosave: true` above needs the memory layer, though.
      in_memory_attempt = self.result_attempts.find { it.attempt_number == n } || result_attempts.build(attempt_number: n)

      in_memory_attempt.assign_attributes(value: legacy_value)
    end
  end

  # We run this _after_ validations as part of the transition process:
  #   In order to make sure that all validations correctly "see" the `result_attempts`,
  #   we only backfill to the old columns once we have established that the attempts are valid
  after_validation :repack_attempts

  # As of writing this comment, we are transitioning `value1..5` to a separate row-based table.
  # We have progressed to productively using the new, normalized `result_attempts` table
  #   wherever we can, but there is still one (annoyingly popular) place where it's hard to make the transition:
  #   The Rankings and Records pages. These feature *very* heavy SQL queries and JOINing in the full
  #   result_attempts there can be expensive, so we rely on the de-normalized value1..5 just for the time being.
  def repack_attempts
    packed_value_attributes = self.attempts.map.with_index(1).to_h { |v, i| [:"value#{i}", v] }
    legacy_attempt_attributes = packed_value_attributes.with_indifferent_access.slice(*Result.attribute_names)

    self.assign_attributes(**legacy_attempt_attributes)
  end

  MARKERS = [nil, "NR", "ER", "WR", "AfR", "AsR", "NAR", "OcR", "SAR"].freeze

  validates :regional_single_record, inclusion: { in: MARKERS }
  validates :regional_average_record, inclusion: { in: MARKERS }

  def country
    Country.c_find(self.country_id)
  end

  validates :person_id, uniqueness: { scope: :round_id, message: "this WCA ID already has a result for that round" }

  scope :final, -> { where(round_type_id: RoundType.final_rounds.select(:id)) }
  scope :succeeded, -> { where("best > 0") }
  scope :average_succeeded, -> { where("average > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("events.rank") }
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
end
