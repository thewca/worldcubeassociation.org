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

  # See the pre-validation hook `backlink_attempts` below for an explanation of `autosave: false`
  has_many :result_attempts, dependent: :destroy, autosave: false

  before_validation :backlink_attempts

  # As of writing this comment, we are transitioning `value1..5` to a separate row-based table.
  # The hooks for actually _writing_ the data are defined below (called `create_or_update_attempts`)
  #   and are working well. However, we can only write once we have established that the data is valid.
  # This means that the validations need to "think" that the result_attempts are already there, but
  #   without actually writing them to the database. To solve this issue, we write them into memory
  #   before validations happen, but also prevent Rails from saving them by using `autosave: false`
  #   on the original associations. If validations pass, our efficient `upsert_all` from the backfilling hook
  #   will take care of everything. If validations fail, the values will still be in memory
  #   but won't be written to the DB, which is (surprisingly!) consistent with normal ActiveRecord properties.
  def backlink_attempts
    memory_attempts = self.result_attempts_attributes.map do |attempt_attributes|
      attempt = self.result_attempts.find { it.attempt_number == attempt_attributes[:attempt_number] } || result_attempts.build(attempt_attributes)

      attempt.tap { it.assign_attributes(**attempt_attributes) }
    end

    self.result_attempts.target = memory_attempts
  end

  after_save :create_or_update_attempts

  def create_or_update_attempts
    attempts = self.result_attempts_attributes(result_id: self.id)

    # Delete attempts when the value was set to 0
    zero_attempts = self.skipped_attempt_numbers
    ResultAttempt.where(result_id: id, attempt_number: zero_attempts).delete_all if zero_attempts.any?

    ResultAttempt.upsert_all(attempts)
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

  def attempts
    [value1, value2, value3, value4, value5]
  end

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
end
