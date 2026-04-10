# frozen_string_literal: true

class Round < ApplicationRecord
  belongs_to :competition_event
  belongs_to :linked_round, optional: true

  has_one :competition, through: :competition_event
  delegate :competition_id, to: :competition_event

  has_many :h2h_matches

  has_one :event, through: :competition_event
  # CompetitionEvent uses the cached value
  delegate :event_id, :event, to: :competition_event

  has_many :registrations, through: :competition_event

  has_many :matched_scramble_sets, dependent: :delete_all

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

  has_many :schedule_activities, -> { root_activities }, dependent: :destroy, inverse_of: :round

  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

  has_many :live_results, -> { order(:global_pos) }, inverse_of: :round
  has_many :live_competitors, through: :live_results, source: :registration
  has_many :colinked_rounds, ->(rd) { where.not(id: rd.id) }, through: :linked_round, source: :rounds
  has_many :colinked_results, through: :colinked_rounds, source: :live_results
  has_many :results
  has_many :scrambles

  has_many :sibling_rounds, through: :competition_event, source: :rounds

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
    linked_round.present? ? linked_round.merged_live_results.filter { it.global_pos.in? 1..3 } : live_results.where(global_pos: 1..3)
  end

  def previous_round
    return nil if number == 1

    if sibling_rounds.loaded?
      sibling_rounds.find { it.number == self.number - 1 }
    else
      sibling_rounds.find_by(number: number - 1)
    end
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
      Registration.where(id: advancing)
    end
  end

  private def bulk_insert_history(live_ids_to_insert, entered_by_user, **attributes)
    history_entries = live_ids_to_insert.map { LiveResultHistoryEntry.build(live_result_id: it, entered_by_id: entered_by_user.id, **attributes) }

    history_entry_attributes = history_entries.map { it.attributes.symbolize_keys.except(:id, :created_at, :updated_at) }
    LiveResultHistoryEntry.insert_all(history_entry_attributes)
  end

  def open_and_lock_previous(locking_user)
    open_count = open_round!(locking_user)
    return [open_count, 0] if first_round?

    round_to_lock = linked_round.present? ? linked_round.first_round_in_link.previous_round : previous_round

    [open_count, round_to_lock.lock_results(locking_user)]
  end

  def clear_round!(clearing_user)
    LiveAttempt.where(live_result_id: live_result_ids).delete_all
    self.bulk_insert_history(live_result_ids, clearing_user, action_type: :cleared)
  end

  def open_round!(opening_user)
    advancing_reg_ids = advancing_registrations.ids

    empty_results = advancing_reg_ids.map do |reg_id|
      LiveResult.empty_result_attributes(reg_id, self.id)
    end
    LiveResult.insert_all!(empty_results)

    inserted_ids = self.live_results.where(registration_id: advancing_reg_ids).ids
    self.bulk_insert_history(inserted_ids, opening_user, action_type: :opened)
  end

  def create_empty_live_result(registration_id)
    live_results.find_or_create_by(registration_id: registration_id) do |lr|
      lr.assign_attributes(LiveResult.empty_result_attributes(registration_id, id))
    end
  end

  def total_competitors
    live_results.size
  end

  def recompute_live_columns(skip_advancing: false)
    recompute_local_pos
    recompute_global_pos
    recompute_advancing unless skip_advancing
    # We need to reset because live results are changed directly on SQL level for more optimized queries
    live_results.reset
  end

  def potential_results
    if linked_round.present?
      linked_round.merged_live_results.select { it.locked_by_id.nil? }
    else
      live_results.where(locked_by_id: nil)
    end
  end

  def recompute_advancing
    results_with_potential = potential_results.to_a.sort_by(&:potential_solve_time)

    advancement_determining_condition = final_round? || linked_round&.final_round? ? AdvancementConditions::RankingCondition.new(3) : advancement_condition

    advancing_ids = advancement_determining_condition.apply(results_with_potential).pluck(:registration_id)
    max_advancing = advancement_determining_condition.max_qualifying(results_with_potential)

    # For linked Rounds wa want to update the results of both rounds so it doesn't matter if you query one or the other round
    results_to_update = relevant_results.where.not(global_pos: nil).where(locked_by_id: nil)

    # We can't update advancing yet if the other linked rounds aren't done yet
    colinked_done = colinked_rounds.all?(&:score_taking_done?)
    if colinked_done && advancing_ids.any?
      results_to_update.update_all(
        ["advancing = (registration_id IN (?)), advancing_questionable = (global_pos <= ?)", advancing_ids, max_advancing],
      )
    else
      results_to_update.update_all(
        ["advancing = FALSE, advancing_questionable = (global_pos <= ?)", max_advancing],
      )
    end
  end

  def recompute_global_pos
    return if format_id == "h"

    # For non-linked rounds, global_pos was already set equal to local_pos in recompute_local_pos
    return if linked_round.blank?

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
    return if format_id == "h"

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
    #
    # For non-linked rounds global_pos equals local_pos, so we set both here to avoid
    # a second UPDATE in recompute_global_pos.
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
      SET r.local_pos = ranked.rank#{', r.global_pos = ranked.rank' if linked_round.blank?}
      WHERE r.round_id = #{id};
    SQL
  end

  def to_live_state
    live_results.includes(:live_attempts).map(&:to_live_state)
  end

  def competitors_live_results_entered
    if live_results.loaded?
      live_results.count(&:complete?)
    else
      live_results.where(live_attempts_count: format.expected_solve_count).count
    end
  end

  def score_taking_done?
    open? && competitors_live_results_entered == total_competitors
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

  def self.find_by_wcif_id!(wcif_id, competition_id, includes: [])
    event_id, number = Round.parse_wcif_id(wcif_id).values_at(:event_id, :round_number)

    all_includes = [:competition_event, *Array.wrap(includes)]

    Round.includes(all_includes).find_by!(competition_event: { competition_id: competition_id, event_id: event_id }, number: number)
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
    # Don't double lock results if we are in a R1 (R2 R3) R4 linked round situation and we are opening rounds
    # separately
    return 0 if relevant_results.first.locked_by.present?

    relevant_results.update_all(locked_by_id: locking_user.id)
    self.bulk_insert_history(relevant_results.ids, locking_user, action_type: :locked)
  end

  STATE_LOCKED = "locked"
  STATE_OPEN = "open"
  STATE_READY = "ready"
  STATE_PENDING = "pending"

  def lifecycle_state
    return STATE_LOCKED if locked?
    return STATE_OPEN if open?
    return STATE_READY if number == 1 || previous_round.score_taking_done?

    STATE_PENDING
  end

  def open?
    live_results.any?
  end

  def locked?
    return false unless score_taking_done?

    if live_results.loaded?
      live_results.count(&:locked?) == total_competitors
    else
      live_results.locked.count == total_competitors
    end
  end

  def first_round?
    number == 1 || (linked_round.present? && linked_round.first_round_in_link.number == 1)
  end

  def relevant_results
    linked_round.present? ? linked_round.live_results : live_results
  end

  # Port from https://github.com/thewca/wca-live/blob/main/lib/wca_live/scoretaking/advancing.ex#L143
  # Basically this just removes the number one placed competitor and then sees who of the non-advancing
  # competitors would make it if that competitor got dnf
  def next_advancing_without(competitor_being_quit)
    already_quit_ids = relevant_results.quit.pluck(:id)

    first_advancing = relevant_results.advancing.first

    candidate_ids = relevant_results.not_advancing.not_quit.pluck(:id)

    return [] if candidate_ids.empty?

    quit_result_ids = relevant_results.where(registration_id: competitor_being_quit).pluck(:id)
    ignored_ids = [first_advancing.id] | quit_result_ids | already_quit_ids

    advancement_determining = relevant_results
                              .where.not(id: ignored_ids)

    # Eager load associations to avoid N+1 on potential_solve_time
    loaded_results = advancement_determining.includes(:live_attempts).to_a

    # Assume that everyone who quit got dnf
    worst_results = Array.new(ignored_ids.length) { LiveResult.build(round: self, best: LiveResult::WORST_POSSIBLE_SCORE, average: LiveResult::WORST_POSSIBLE_SCORE) }
    results_with_worst = (loaded_results + worst_results).sort_by(&:values_for_sorting)

    hypothetically_advancing_ids = advancement_condition.apply(results_with_worst).pluck(:id)

    relevant_results.where(id: hypothetically_advancing_ids & candidate_ids)
  end

  def quit_from_round!(registration_id, quitting_user, to_advance: nil)
    transaction do
      Live::DiffHelper.broadcast_changes(self) do
        result = live_results.find_by!(registration_id: registration_id)
        result.destroy!
        live_results.create(to_advance.map { { **LiveResult.empty_result_attributes(it.registration_id, self.id) } }) if to_advance.present?
        recompute_advancing
        live_results.reset
      end

      return 1 if first_round?

      1 + Live::DiffHelper.broadcast_changes(previous_round) do
        to_advance&.update!(advancing: true)
        quit_from_previous_round(registration_id, quitting_user)
      end
    end
  end

  def quit_from_previous_round(registration_id, quitting_user)
    results = previous_round.relevant_results
    results.where(registration_id: registration_id).count { |r| r.mark_as_quit!(quitting_user) }
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

  def to_wcif(include_results: true)
    {
      "id" => wcif_id,
      "format" => self.format_id,
      "timeLimit" => event.can_change_time_limit? ? time_limit&.to_wcif : nil,
      "cutoff" => cutoff&.to_wcif,
      "advancementCondition" => advancement_condition&.to_wcif,
      "scrambleSetCount" => self.scramble_set_count,
      "results" => include_results ? round_results.map(&:to_wcif) : nil,
      "extensions" => wcif_extensions.map(&:to_wcif),
    }
  end

  def to_live_results_json(only_podiums: false)
    {
      **self.to_wcif(include_results: false).compact_blank,
      "round_id" => id,
      "competitors" => live_competitors.includes(:user).map(&:to_live_json),
      "results" => only_podiums ? live_podium : live_results,
      "state_hash" => Live::DiffHelper.state_hash(to_live_state),
      "linked_round_ids" => linked_round&.wcif_ids,
    }
  end

  def to_live_info_json
    state = lifecycle_state
    json = {
      **self.to_wcif(include_results: false).compact_blank,
      "state" => state,
    }
    if [STATE_OPEN, STATE_LOCKED].include?(state)
      json = json.merge({
                          "total_competitors" => total_competitors,
                        })
    end

    if state == STATE_OPEN
      json = json.merge({
                          "competitors_live_results_entered" => competitors_live_results_entered,
                        })
    end
    json
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
