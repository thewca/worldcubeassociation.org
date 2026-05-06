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

  serialize :participation_condition, coder: ResultConditions::ResultCondition
  validates_associated :participation_condition

  belongs_to :participation_source, polymorphic: true, optional: true
  has_many :target_rounds, class_name: "Round", as: :participation_source

  has_many :schedule_activities, -> { root_activities }, dependent: :destroy, inverse_of: :round

  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

  has_many :live_results, -> { order(:global_pos) }, inverse_of: :round
  has_many :live_competitors, through: :live_results, source: :registration
  has_many :colinked_rounds, ->(rd) { where.not(id: rd.id) }, through: :linked_round, source: :rounds
  has_many :colinked_results, through: :colinked_rounds, source: :live_results
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

  # The event dictates which formats are even allowed in the first place, hence the prefix
  delegate :formats, :format_ids, to: :event, prefix: :allowed
  validates :format, inclusion: { in: :allowed_formats, message: ->(round, _args) { "'#{round.format_id}' is not allowed for '#{round.event_id}'" } }

  validates :advancement_condition, presence: { if: :advancement_condition_changed?, unless: :final_round?, message: "cannot be un-set on a non-final round" }, on: :update
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
    linked_round&.live_podium || live_results.advancing.where(global_pos: LiveResult::PODIUM_RANGE)
  end

  def advancing_competitor_ids
    live_results.advancing.pluck(:registration_id)
  end

  private def bulk_insert_history(live_ids_to_insert, entered_by_user, **attributes)
    history_entries = live_ids_to_insert.map { LiveResultHistoryEntry.build(live_result_id: it, entered_by_id: entered_by_user.id, **attributes) }

    history_entry_attributes = history_entries.map { it.attributes.symbolize_keys.except(:id, :created_at, :updated_at) }
    LiveResultHistoryEntry.insert_all(history_entry_attributes)
  end

  def open_and_lock_previous(locking_user)
    open_count = open_round!(locking_user)
    return [open_count, 0] if first_round?

    [open_count, participation_source.lock_results(locking_user)]
  end

  def clear_round!(clearing_user)
    LiveAttempt.where(live_result_id: live_result_ids).delete_all
    # We have to use update_all here because live_attempts_count is write protected
    live_results.update_all(best: 0, average: 0, live_attempts_count: 0, advancing: false, advancing_questionable: false)
    self.bulk_insert_history(live_result_ids, clearing_user, action_type: :cleared)
  end

  def open_round!(opening_user)
    advancing_reg_ids = participation_source.advancing_competitor_ids

    empty_results = advancing_reg_ids.map do |reg_id|
      LiveResult.empty_result_attributes(reg_id, self.id)
    end
    LiveResult.insert_all!(empty_results)

    inserted_ids = self.live_results.where(registration_id: advancing_reg_ids).ids
    self.bulk_insert_history(inserted_ids, opening_user, action_type: :opened)
    inserted_ids.count
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
    linked_round&.live_results&.reset
  end

  def target_participation_condition
    self.linked_round&.target_participation_condition || self.target_rounds.first&.participation_condition
  end

  def ranking_format
    self.format
  end

  def recompute_advancing
    if linked_round.present?
      colinked_done = colinked_rounds.all?(&:score_taking_done?)
      return linked_round.recompute_advancing(colinked_done)
    end

    Live::Advancing.recompute_advancing(self)
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
        (SELECT registration_id,
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
            WHERE rownum = 1) AS person_best) ranked ON r.registration_id = ranked.registration_id
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

  def load_live_results!(round_results_wcif, current_user)
    person_id_to_registration_id = self.competition.registrations
                                       .to_h { [it.registrant_id, it.id] }

    results_by_registration_id = self.live_results.index_by(&:registration_id)
    recorded_registration_ids = results_by_registration_id.keys

    database_now = self.current_time_from_proper_timezone

    self.transaction do
      incoming_registration_ids = round_results_wcif.map { person_id_to_registration_id[it["personId"]] }
      recorded_not_incoming = results_by_registration_id.except(*incoming_registration_ids)

      round_already_had_results = !results_by_registration_id.empty?

      result_ids_to_delete = recorded_not_incoming.values.pluck(:id)
      # Hard-deleting the current round matches our ILR quitting behavior.
      #   TODO: Think it over whether that's really the best idea.
      LiveResult.where(id: result_ids_to_delete).delete_all

      unless self.first_round?
        registrations_who_were_deleted = recorded_not_incoming.values.pluck(:registration_id)

        # Mark everyone from previous rounds as quit
        previous_round_results = self.participation_source
                                     .live_results
                                     .where(registration_id: registrations_who_were_deleted)

        previous_round_results.update_all(quit_by_id: current_user)

        quit_history_items = previous_round_results.ids.map do |result_id|
          {
            live_result_id: result_id,
            entered_by_id: current_user.id,
            entered_at: database_now,
            action_type: :quit,
            action_source: :api_sync,
          }
        end

        LiveResultHistoryEntry.insert_all!(quit_history_items)
      end

      result_data_to_load = round_results_wcif.map do |round_result_wcif|
        registration_db_id = person_id_to_registration_id[round_result_wcif["personId"]]

        # The REAL `last_attempt_entered_at` is being set below at the very end,
        #   because only at that point can we compute which results _actually_ changed.
        # But MySQL upserting needs a "default value" to assume for the INSERT INTO part,
        #   so we just copy over the one which we already have
        last_attempt_entered_at = results_by_registration_id[registration_db_id]&.last_attempt_entered_at || database_now

        # Normally, this column is computed by a Rails `counter_cache`, but because we're using a bulk operation,
        #   we have to manually assign the value instead.
        attempts_count = round_result_wcif["attempts"]&.length || 0

        {
          registration_id: registration_db_id,
          round_id: self.id,
          best: round_result_wcif["best"],
          average: round_result_wcif["average"],
          global_pos: round_result_wcif["ranking"],
          local_pos: round_result_wcif["ranking"],
          last_attempt_entered_at: last_attempt_entered_at,
          live_attempts_count: attempts_count,
        }
      end

      LiveResult.upsert_all(result_data_to_load)

      # Reload to get the generated IDs
      results_by_registration_id = self.live_results.reload
                                       .includes(:live_attempts)
                                       .index_by(&:registration_id)

      attempts_to_load = round_results_wcif.flat_map do |round_result_wcif|
        registration_id = person_id_to_registration_id[round_result_wcif["personId"]]
        live_result = results_by_registration_id[registration_id]

        round_result_wcif["attempts"].map.with_index(1) do |attempt, attempt_number|
          {
            live_result_id: live_result.id,
            attempt_number: attempt_number,
            value: attempt["result"],
          }
        end
      end

      LiveAttempt.upsert_all(attempts_to_load) if attempts_to_load.any?

      histories_to_generate = round_results_wcif.filter_map do |round_result_wcif|
        registration_id = person_id_to_registration_id[round_result_wcif["personId"]]
        live_result = results_by_registration_id[registration_id]

        recorded_attempts = live_result.live_attempts.pluck(:value)
        imported_attempts = round_result_wcif["attempts"].pluck("result")

        result_already_existed = recorded_registration_ids.include?(person_id_to_registration_id[round_result_wcif["personId"]])

        result_has_attempts = !imported_attempts.empty?
        attempts_have_changed = recorded_attempts != imported_attempts

        next if result_has_attempts && !attempts_have_changed

        action_type = if result_has_attempts
                        :scoretaking
                      elsif result_already_existed
                        :cleared
                      elsif round_already_had_results
                        :advanced_next
                      else
                        :opened
                      end

        attempts = imported_attempts if action_type == :scoretaking

        {
          live_result_id: live_result.id,
          entered_by_id: current_user.id,
          entered_at: database_now,
          attempt_details: attempts,
          action_type: action_type,
          action_source: :api_sync,
        }
      end

      LiveResultHistoryEntry.insert_all!(histories_to_generate) if histories_to_generate.any?

      results_which_changed = histories_to_generate.pluck(:live_result_id)
      LiveResult.where(id: results_which_changed).update_all(last_attempt_entered_at: database_now)
    end

    # Sync up all internal results columns not covered by the sync payload
    #   This also resets the corresponding `live_results` associations
    self.recompute_live_columns
  end

  def self.load_wcif_advancement_condition(wcif_round, all_wcif_rounds, version: Competition::WCIF_STABLE_VERSION)
    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      round_number = self.parse_wcif_id(wcif_round["id"])[:round_number]

      return nil if round_number == all_wcif_rounds.size

      if wcif_round["linkedRounds"].present?
        last_round_id = wcif_round["linkedRounds"].max_by { self.parse_wcif_id(it)[:round_number] }

        if wcif_round["id"] != last_round_id
          # Basically faking because our current V1 store does not support dual round advancement.
          # These will be skipped when re-serializing into WCIF v2
          return AdvancementConditions::PercentCondition.new(100)
        end
      end

      # This call is safe because we have an "if this is last round" guard clause above already
      next_wcif_round = all_wcif_rounds[round_number] # WCIF numbers are 1-based, so no +1 necessary
      next_participation_condition = next_wcif_round.dig("participationRuleset", "participationSource", "resultCondition")

      backported_wcif_v1 = {
        "type" => next_participation_condition["type"].gsub('resultAchieved', 'attemptResult'),
        "level" => next_participation_condition["value"],
      }

      AdvancementConditions::AdvancementCondition.load(backported_wcif_v1)
    else
      AdvancementConditions::AdvancementCondition.load(wcif_round["advancementCondition"])
    end
  end

  def self.wcif_to_round_attributes(event, round_wcif, all_rounds_wcif, version: Competition::WCIF_STABLE_VERSION)
    {
      number: self.parse_wcif_id(round_wcif["id"])[:round_number],
      total_number_of_rounds: all_rounds_wcif.size,
      format_id: round_wcif["format"],
      time_limit: event.can_change_time_limit? ? TimeLimit.load(round_wcif["timeLimit"]) : nil,
      cutoff: Cutoff.load(round_wcif["cutoff"]),
      advancement_condition: self.load_wcif_advancement_condition(round_wcif, all_rounds_wcif, version: version),
      scramble_set_count: round_wcif["scrambleSetCount"],
      round_results: RoundResults.load(round_wcif["results"]),
    }
  end

  def self.backport_participation_source(round_model, all_rounds_model)
    return round_model.competition_event if round_model.number == 1

    if round_model.linked_round.present?
      first_round_in_link = round_model.linked_round.first_round_in_link

      if round_model != first_round_in_link
        return self.backport_participation_source(
          first_round_in_link,
          all_rounds_model,
        )
      end
    end

    # If we reached this point, we implicitly know that round_number > 1
    #   so looking back in the all_rounds array is fine.
    # Note that we calculate -1 for "previous round" AND -1 because round numbers are 1-based,
    #   which gives -2 in total.
    previous_round = all_rounds_model[round_model.number - 2]

    previous_round.linked_round || previous_round
  end

  def self.backport_participation_condition(participation_source)
    case participation_source
    when CompetitionEvent
      nil
    when Round
      adv_condition = participation_source.advancement_condition
      ResultConditions::Utils.upcycle_advancement_condition(adv_condition, participation_source)
    when LinkedRound
      self.backport_participation_condition(participation_source.last_round_in_link)
    end
  end

  def self.wcif_backlinking(round_model, all_rounds_model)
    participation_source = self.backport_participation_source(round_model, all_rounds_model)

    {
      participation_source: participation_source,
      participation_condition: self.backport_participation_condition(participation_source),
    }
  end

  def lock_results(locking_user)
    count = live_results.update_all(locked_by_id: locking_user.id)
    self.bulk_insert_history(live_results.ids, locking_user, action_type: :locked)
    count
  end

  STATE_LOCKED = "locked"
  STATE_OPEN = "open"
  STATE_READY = "ready"
  STATE_PENDING = "pending"

  def lifecycle_state
    return STATE_LOCKED if locked?
    return STATE_OPEN if open?
    return STATE_READY if participation_source.score_taking_done?

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

  alias_method :advancement_results, :live_results

  # Port from https://github.com/thewca/wca-live/blob/main/lib/wca_live/scoretaking/advancing.ex#L143
  # Basically this just removes the number one placed competitor and then sees who of the non-advancing
  # competitors would make it if that competitor got dnf
  def next_participating_without(competitor_being_quit)
    live_results = self.participation_source.advancement_results.to_a

    already_quit_ids = live_results.select(&:quit?).pluck(:id)

    first_advancing = live_results.find(&:advancing?)

    candidate_ids = live_results.reject(&:advancing?).reject(&:quit?).pluck(:id)

    return [] if candidate_ids.empty?

    quit_result_ids = live_results.select { it.registration_id == competitor_being_quit }.pluck(:id)
    ignored_ids = [first_advancing&.id].compact | quit_result_ids | already_quit_ids

    advancement_determining = live_results.reject { ignored_ids.include? it.id }

    # Assume that everyone who quit got dnf
    worst_results = ignored_ids.map do |ignored_id|
      LiveResult.build(
        id: ignored_id,
        round: self.participation_source.rounds.first,
        best: LiveResult::WORST_POSSIBLE_SCORE,
        average: LiveResult::WORST_POSSIBLE_SCORE,
      )
    end

    results_with_worst = (advancement_determining + worst_results).sort_by(&:values_for_sorting)

    hypothetically_advancing_ids = self.participation_condition.apply(results_with_worst).pluck(:id)
    next_advancing_ids = hypothetically_advancing_ids & candidate_ids

    live_results.select { next_advancing_ids.include? it.id }
  end

  def rounds
    [self]
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

      participation_source.rounds.count do |round|
        1 + Live::DiffHelper.broadcast_changes(round) do
          round.live_results.where(id: to_advance&.pluck(:id)).update!(advancing: true)
          round.live_results.where(registration_id: registration_id).count { |r| r.mark_as_quit!(quitting_user) }
        end
      end
    end
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

  def as_wcif_participation_source(target_round)
    {
      "type" => "round",
      "roundId" => self.wcif_id,
      "resultCondition" => target_round.participation_condition&.to_wcif,
    }
  end

  def to_wcif(include_results: true, version: Competition::WCIF_STABLE_VERSION)
    base_wcif = {
      "id" => wcif_id,
      "format" => self.format_id,
      "timeLimit" => event.can_change_time_limit? ? time_limit&.to_wcif : nil,
      "cutoff" => cutoff&.to_wcif,
      "scrambleSetCount" => self.scramble_set_count,
      "results" => include_results ? round_results.map(&:to_wcif) : nil,
      "extensions" => wcif_extensions.map(&:to_wcif),
    }

    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      base_wcif.merge(
        "linkedRounds" => linked_round&.wcif_ids,
        "participationRuleset" => {
          "participationSource" => participation_source.as_wcif_participation_source(self),
          "reservedPlaces" => nil,
        },
      )
    else
      base_wcif.merge(
        "advancementCondition" => advancement_condition&.to_wcif,
      )
    end
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

  def self.wcif_json_schema(version: Competition::WCIF_STABLE_VERSION)
    {
      "type" => "object",
      "properties" => self.wcif_json_schema_properties(version: version),
    }
  end

  def self.wcif_json_schema_properties(version: Competition::WCIF_STABLE_VERSION)
    base_properties = {
      "id" => { "type" => "string" },
      "format" => { "type" => "string", "enum" => Format.ids },
      "timeLimit" => TimeLimit.wcif_json_schema,
      "cutoff" => Cutoff.wcif_json_schema,
      "results" => { "type" => "array", "items" => RoundResult.wcif_json_schema },
      "scrambleSets" => { "type" => "array" }, # TODO: expand on this
      "scrambleSetCount" => { "type" => "integer" },
      "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
    }

    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      base_properties.merge(
        "linkedRounds" => {
          "type" => %w[array null],
          "items" => { "type" => "string" },
        },
        "participationRuleset" => {
          "type" => "object",
          "properties" => {
            "participationSource" => {
              "oneOf" => [
                {
                  "type" => "object",
                  "properties" => {
                    "type" => { "const" => "registrations" },
                  },
                },
                {
                  "type" => "object",
                  "properties" => {
                    "type" => { "const" => "round" },
                    "roundId" => { "type" => "string" },
                    "resultCondition" => ResultConditions::ResultCondition.wcif_json_schema,
                  },
                },
                {
                  "type" => "object",
                  "properties" => {
                    "type" => { "const" => "linkedRounds" },
                    "roundIds" => {
                      "type" => "array",
                      "items" => { "type" => "string" },
                    },
                    "resultCondition" => ResultConditions::ResultCondition.wcif_json_schema,
                  },
                },
              ],
            },
            "reservedPlaces" => {
              "type" => %w[object null],
              "properties" => {
                "nationalities" => {
                  "type" => "array",
                  "items" => { "type" => "string" },
                },
                "reservations" => { "type" => "integer" },
              },
            },
          },
        },
      )
    else
      base_properties.merge(
        "advancementCondition" => AdvancementConditions::AdvancementCondition.wcif_json_schema,
      )
    end
  end

  def self.name_from_attributes_id(event_id, round_type_id)
    name_from_attributes(Event.c_find(event_id), RoundType.c_find(round_type_id))
  end

  def self.name_from_attributes(event, round_type)
    I18n.t("round.name", event_name: event.name, round_name: round_type.name)
  end
end
