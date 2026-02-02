# frozen_string_literal: true

class Round < ApplicationRecord
  belongs_to :competition_event
  belongs_to :linked_round, optional: true

  has_one :competition, through: :competition_event
  delegate :competition_id, to: :competition_event

  has_one :event, through: :competition_event
  # CompetitionEvent uses the cached value
  delegate :event_id, :event, to: :competition_event

  has_many :registrations, through: :competition_event

  has_many :matched_scramble_sets, -> { order(:ordered_index) }, class_name: 'InboxScrambleSet', foreign_key: "matched_round_id", inverse_of: :matched_round, dependent: :nullify

  # For the following association, we want to keep it to be able to do some joins,
  # but we definitely want to use cached values when directly using the method.
  belongs_to :format
  def format
    Format.c_find(format_id)
  end

  delegate :can_change_time_limit?, to: :event

  scope :ordered, -> { order(:number) }
  scope :h2h, -> { where(is_h2h_mock: true) }

  serialize :time_limit, coder: TimeLimit
  validates_associated :time_limit

  serialize :cutoff, coder: Cutoff
  validates_associated :cutoff

  serialize :advancement_condition, coder: AdvancementConditions::AdvancementCondition
  validates_associated :advancement_condition

  serialize :round_results, coder: RoundResults
  validates_associated :round_results

  has_many :schedule_activities, -> { root_activities }, dependent: :destroy

  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

  has_many :live_results, -> { order(:global_pos) }
  has_many :live_competitors, through: :live_results, source: :registration
  has_many :results
  has_many :scrambles

  MAX_NUMBER = 4
  validates :number,
            numericality: { only_integer: true,
                            greater_than_or_equal_to: 1,
                            less_than_or_equal_to: MAX_NUMBER,
                            unless: :old_type? }

  # Qualification rounds/b-final are handled weirdly, they have round number 0
  # and do not count towards the total amount of rounds.
  OLD_TYPES = %w[0 b].freeze
  validates :old_type, inclusion: { in: OLD_TYPES, allow_nil: true }
  after_validation(if: :old_type?) do
    self.number = 0
  end

  # Competitions before 2026 have to use Mo3 for 333bf, but after 2026 they need to use Ao5
  REGULATIONS_2026_START_DATE = Date.new(2026, 1, 1)
  private def expected_333bf_format
    competition.start_date >= REGULATIONS_2026_START_DATE ? "5" : "3"
  end

  validates :format_id, comparison: {
    equal_to: :expected_333bf_format,
    if: ->(round) { round.format_id == "333bf" },
    message: ->(round, _args) { "#{round.format_id} is not allowed for 333bf for a competition taking place on #{round.competition.start_date} due to the 2026 regulations" },
  }

  # The event dictates which formats are even allowed in the first place, hence the prefix
  delegate :formats, :format_ids, to: :event, prefix: :allowed
  validates :format, inclusion: { in: :allowed_formats, message: ->(round, _args) { "'#{round.format_id}' is not allowed for '#{round.event_id}'" } }

  validates :advancement_condition, absence: { if: :final_round?, message: "cannot be set on a final round" }

  def initialize(attributes = nil)
    # Overrides the default constructor to setup the default time limit if not
    # set explicitly.
    # We do want to let the opportunity to the user to specify the 'undefined'
    # time limit represented as null in the db (TimeLimit::UNDEF_TL)
    attributes ||= {}
    # Note there is a subtle difference between using '||=' and 'key?'.
    # We do want to allow specifying a 'nil' value for the :time_limit attribute.
    attributes[:time_limit] = TimeLimit.new unless attributes.key?(:time_limit)
    super
  end

  # Compute a round type id from round information
  def round_type_id
    if number == total_number_of_rounds
      cutoff ? "c" : "f"
    elsif number == 1
      cutoff ? "d" : "1"
    elsif number == 2
      cutoff ? "e" : "2"
    elsif old_type == "0"
      cutoff ? "h" : "0"
    elsif old_type == "b"
      "b"
    else
      # Cutoff third round/Semi Final
      cutoff ? "g" : "3"
    end
  end

  def formats_used
    cutoff_format = Format.c_find!(cutoff.number_of_attempts.to_s) if cutoff
    [cutoff_format, format].compact
  end

  def full_format_name(with_short_names: false, with_tooltips: false)
    # 'with_tooltips' implies that short names are used for display, and long
    # names are used in the tooltip.
    phase_formats = formats_used
    phase_formats.map! do |f|
      if with_tooltips
        content_tag(:span, f.short_name, data: { toggle: "tooltip" }, title: f.name)
      elsif with_short_names
        f.short_name
      else
        f.name
      end
    end
    safe_join(phase_formats, " / ")
  end

  def round_type
    RoundType.c_find(round_type_id)
  end

  def final_round?
    number == total_number_of_rounds
  end

  def name
    Round.name_from_attributes(event, round_type)
  end

  def time_limit_to_s
    time_limit.to_s(self)
  end

  def cutoff_to_s(short: false)
    cutoff ? cutoff.to_s(self, short: short) : ""
  end

  def advancement_condition_to_s(short: false)
    advancement_condition ? advancement_condition.to_s(self, short: short) : ""
  end

  def live_podium
    live_results.where(global_pos: 1..3)
  end

  def previous_round
    return nil if number == 1

    Round.joins(:competition_event).find_by(competition_event: competition_event, number: number - 1)
  end

  def consider_previous_round_results?
    # All linked rounds except the first one in a chain of linked rounds
    linked_round.present? && linked_round.first_round_in_link.id != id
  end

  def advancing_registrations
    if number == 1
      registrations.accepted
    elsif consider_previous_round_results?
      linked_round.first_round_in_link.advancing_registrations
    else
      advancing = previous_round.live_results.where(advancing: true).pluck(:registration_id)
      Registration.find(advancing)
    end
  end

  def open_and_lock_previous(locking_user)
    open_round!
    return 0 if number == 1 || (linked_round.present? && linked_round.first_round_in_link.number == 1)

    round_to_lock = linked_round.present? ? linked_round.first_round_in_link.previous_round : previous_round

    round_to_lock.lock_results(locking_user)
  end

  def open_round!
    empty_results = advancing_registrations.map do |r|
      { registration_id: r.id, round_id: id, average: 0, best: 0, last_attempt_entered_at: current_time_from_proper_timezone }
    end
    LiveResult.insert_all!(empty_results)
  end

  def total_competitors
    live_competitors.count
  end

  def recompute_live_columns(skip_advancing: false)
    recompute_local_pos
    recompute_global_pos
    recompute_advancing unless skip_advancing
  end

  def recompute_advancing
    has_linked_round = linked_round.present?
    advancement_determining_results = has_linked_round ? linked_round.live_results : live_results

    # Only ranked results that are not locked can be considered for advancing.
    round_results = advancement_determining_results.where.not(global_pos: nil).where(locked_by_id: nil)
    round_results.update_all(advancing: false, advancing_questionable: false)

    missing_attempts = total_competitors - round_results.count
    potential_results = Array.new(missing_attempts) { LiveResult.build(round: self) }
    results_with_potential = (round_results.to_a + potential_results).sort_by(&:potential_solve_time)

    qualifying_index = if final_round?
                         3
                       else
                         # Our Regulations allow at most 75% of competitors to proceed
                         max_qualifying = (round_results.count * 0.75).floor
                         [advancement_condition.max_advancing(round_results), max_qualifying].min
                       end

    round_results.update_all("advancing_questionable = global_pos BETWEEN 1 AND #{qualifying_index}")

    # Determine which results would advance if everyone achieved their best possible attempt.
    advancing_ids = results_with_potential.take(qualifying_index).select(&:complete?).pluck(:id)

    LiveResult.where(id: advancing_ids).update_all(advancing: true)
  end

  def recompute_global_pos
    # For non-linked rounds, just set the global_pos to local_pos
    return live_results.update_all("global_pos = local_pos") if linked_round.blank?

    rank_by = format.rank_by_column
    secondary_rank_by = format.secondary_rank_by_column
    round_ids = linked_round.round_ids.join(",")

    # Similar to the query that recomputes local_pos, but
    # at first it computes the best result of a person over all linked rounds
    # by using the same ORDER BY <=0 trick
    query = <<~SQL.squish
      UPDATE live_results r
      LEFT JOIN
        (SELECT id,
                RANK() OVER (ORDER BY person_best.#{rank_by} <= 0,
                             person_best.#{rank_by} ASC #{", person_best.#{secondary_rank_by} <= 0, person_best.#{secondary_rank_by} ASC" if secondary_rank_by}) AS ranking
         FROM
           (SELECT *
            FROM
              (SELECT lr.*,
                      ROW_NUMBER() OVER (PARTITION BY lr.registration_id
                                         ORDER BY (lr.#{rank_by} <= 0) ASC,
                                         lr.#{rank_by} ASC #{", lr.#{secondary_rank_by} <= 0, lr.#{secondary_rank_by} ASC" if secondary_rank_by}) AS rownum
               FROM live_results lr
               WHERE lr.round_id IN (#{round_ids})
                 AND lr.best != 0) x
            WHERE rownum = 1) AS person_best) ranked ON r.id = ranked.id
      SET r.global_pos = ranked.ranking
      WHERE r.round_id IN (#{round_ids});
    SQL

    ActiveRecord::Base.connection.exec_query query
  end

  def recompute_local_pos
    rank_by = format.rank_by_column
    # We only want to decide ties by single in events decided by average
    secondary_rank_by = format.secondary_rank_by_column
    # The following query uses an `ORDER BY best <= 0, best ASC` trick. The idea is:
    #   1. The first part of the `ORDER BY` evaluates to a boolean. Booleans are just
    #     `TINYINT` in MySQL with TRUE=1 and FALSE=0, so that FALSE < TRUE.
    #     This means that valid attempts where `best <= 0` is FALSE come first, and
    #     invalid attempts where `best <= 0` is TRUE come last.
    #   2. The attempts are then sorted among themselves using their normal numeric value.
    #     This works in particular because sorting in MySQL is stable, i.e. the sorting
    #     based on the second part won't destroy the order established by the first part.
    ActiveRecord::Base.connection.exec_query <<~SQL.squish
      UPDATE live_results r
      LEFT JOIN (
          SELECT id,
                 RANK() OVER (
                     ORDER BY #{rank_by} <= 0, #{rank_by} ASC
                       #{", #{secondary_rank_by} <= 0, #{secondary_rank_by} ASC" if secondary_rank_by}
                 ) AS `rank`
          FROM live_results
          WHERE round_id = #{id} AND best != 0
      ) ranked
      ON r.id = ranked.id
      SET r.local_pos = ranked.rank
      WHERE r.round_id = #{id};
    SQL
  end

  def competitors_live_results_entered
    live_results.not_empty.count
  end

  def score_taking_done?
    competitors_live_results_entered == total_competitors
  end

  def time_limit_undefined?
    can_change_time_limit? && time_limit == TimeLimit::UNDEF_TL
  end

  def advancement_condition_is_valid?
    final_round? || advancement_condition
  end

  def cutoff_is_greater_than_time_limit?
    cutoff && time_limit != TimeLimit::UNDEF_TL && time_limit.cumulative_round_ids.empty? ? cutoff.attempt_result > time_limit.centiseconds : false
  end

  # cutoffs are too fast if they are less than 5 seconds
  def cutoff_is_too_fast?
    cutoff && self.event.timed_event? && cutoff.attempt_result < 500
  end

  # cutoffs are too slow if they are more than 10 minutes
  def cutoff_is_too_slow?
    cutoff && self.event.timed_event? && cutoff.attempt_result > 60_000
  end

  # time limits are too fast if they are less than 10 seconds
  def time_limit_is_too_fast?
    time_limit != TimeLimit::UNDEF_TL && time_limit.centiseconds < 1000
  end

  # time limits are too slow if they are more than 10 minutes in fast events
  def time_limit_is_too_slow?
    time_limit != TimeLimit::UNDEF_TL && time_limit.cumulative_round_ids.empty? && self.event.fast_event? && time_limit.centiseconds > 60_000
  end

  def self.find_by_wcif_id!(wcif_id, competition_id)
    event_id, number = Round.parse_wcif_id(wcif_id).values_at(:event_id, :round_number)
    Round.includes(:competition_event, live_results: %i[live_attempts event]).find_by!(competition_event: { competition_id: competition_id, event_id: event_id }, number: number)
  end

  def self.parse_wcif_id(wcif_id)
    ScheduleActivity.parse_activity_code(wcif_id)
  end

  def self.wcif_to_round_attributes(event, wcif, round_number, total_rounds)
    {
      number: round_number,
      total_number_of_rounds: total_rounds,
      format_id: wcif["format"],
      time_limit: event.can_change_time_limit? ? TimeLimit.load(wcif["timeLimit"]) : nil,
      cutoff: Cutoff.load(wcif["cutoff"]),
      advancement_condition: AdvancementConditions::AdvancementCondition.load(wcif["advancementCondition"]),
      scramble_set_count: wcif["scrambleSetCount"],
      round_results: RoundResults.load(wcif["results"]),
    }
  end

  def lock_results(locking_user)
    results_to_lock = linked_round.present? ? linked_round.live_results : live_results

    results_to_lock.update_all(locked_by_id: locking_user.id)
  end

  def quit_from_round!(registration_id, quitting_user)
    result = live_results.find_by!(registration_id: registration_id)

    is_quit = result.destroy

    return is_quit ? 1 : 0 if number == 1 || (linked_round.present? && linked_round.first_round_in_series)

    # We need to also quit the result from the previous round so advancement can be correctly shown
    previous_round_results = previous_round.linked_round.present? ? previous_round.linked_round.live_results : previous_round.live_results

    previous_round_results.where(registration_id: registration_id).map { it.mark_as_quit(quitting_user) }.count { it == true }
  end

  def wcif_id
    "#{self.event_id}-r#{self.number}"
  end

  def human_id
    "#{self.event_id}-#{self.round_type_id}"
  end

  def to_string_map(short: false)
    {
      wcif_id: wcif_id,
      name: name,
      event_id: event_id,
      cumulative_round_ids: time_limit.cumulative_round_ids,
      format_name: full_format_name(with_short_names: true),
      time_limit: time_limit_to_s,
      cutoff: cutoff_to_s(short: short),
      advancement: advancement_condition_to_s(short: short),
    }
  end

  def to_wcif
    {
      "id" => wcif_id,
      "format" => self.format_id,
      "timeLimit" => event.can_change_time_limit? ? time_limit&.to_wcif : nil,
      "cutoff" => cutoff&.to_wcif,
      "advancementCondition" => advancement_condition&.to_wcif,
      "scrambleSetCount" => self.scramble_set_count,
      "results" => round_results.map(&:to_wcif),
      "extensions" => wcif_extensions.map(&:to_wcif),
    }
  end

  def to_live_json(only_podiums: false)
    {
      **self.to_wcif,
      "round_id" => id,
      "competitors" => live_competitors.includes(:user).map { it.as_json({ methods: %i[user_name], only: %i[id user_id registrant_id] }) },
      "results" => only_podiums ? live_podium : live_results,
    }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "string" },
        "format" => { "type" => "string", "enum" => Format.ids },
        "timeLimit" => TimeLimit.wcif_json_schema,
        "cutoff" => Cutoff.wcif_json_schema,
        "advancementCondition" => AdvancementConditions::AdvancementCondition.wcif_json_schema,
        "results" => { "type" => "array", "items" => RoundResult.wcif_json_schema },
        "scrambleSets" => { "type" => "array" }, # TODO: expand on this
        "scrambleSetCount" => { "type" => "integer" },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
      },
    }
  end

  def self.name_from_attributes_id(event_id, round_type_id)
    name_from_attributes(Event.c_find(event_id), RoundType.c_find(round_type_id))
  end

  def self.name_from_attributes(event, round_type)
    I18n.t("round.name", event_name: event.name, round_name: round_type.name)
  end
end
