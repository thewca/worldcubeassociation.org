# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds, -> { ordered }, inverse_of: :linked_round, dependent: :nullify, after_remove: :destroy_if_orphaned
  has_many :results, through: :rounds
  has_many :live_results, through: :rounds
  has_many :formats, -> { unscope(:order).distinct }, through: :rounds
  has_many :live_competitors, through: :live_results, source: :registration
  has_many :competition_events, -> { unscope(:order).distinct }, through: :rounds
  has_many :target_rounds, class_name: "Round", as: :participation_source

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition event" }

  # see https://www.worldcubeassociation.org/regulations/#9v1
  validates :first_round_number, comparison: { equal_to: 1, message: "can only include the first two rounds of a competition", allow_nil: true }
  validates :round_ids, length: { maximum: 2, message: "can only include up to 2 rounds in a Dual Round" }

  # see https://www.worldcubeassociation.org/regulations/#9v2
  validates :final_round_of_championship?, absence: { message: "cannot include the final round of any championship" }

  # see https://www.worldcubeassociation.org/regulations/#9v3
  validates :format_ids, length: { maximum: 1, message: "all rounds must have the same format" }
  validates :round_cutoffs, length: { maximum: 1, message: "all rounds must have the same cutoff" }
  validates :round_time_limits, length: { maximum: 1, message: "all rounds must have the same time limit" }

  after_touch :reset_round_information
  def reset_round_information
    self.rounds.reset

    # Even associations that define `through` have their own cache
    #   which needs to be reset individually
    self.formats.reset
    self.competition_events.reset
  end

  def round_cutoffs
    rounds.filter_map(&:cutoff).uniq(&:to_wcif)
  end

  def round_time_limits
    rounds.filter_map(&:time_limit).uniq(&:to_wcif)
  end

  delegate :number, to: :first_round_in_link, prefix: :first_round, allow_nil: true

  def final_round_of_championship?
    last_round_in_link&.final_round? && last_round_in_link.competition.any_championship?
  end

  def merged_live_results
    LinkedRound.combine_results(self.live_results)
  end

  def first_round_in_link
    rounds.first
  end

  def last_round_in_link
    rounds.last
  end

  def wcif_ids
    rounds.map(&:wcif_id)
  end

  def score_taking_done?
    rounds.all?(&:score_taking_done?)
  end

  def total_competitors
    live_results.distinct.count(:registration_id)
  end

  # For 9m purposes, a Dual Round sits at the position of its last round
  delegate :number, to: :last_round_in_link

  # A LinkedRound can only span the first rounds of an event,
  #   so this is always the CompetitionEvent
  delegate :participation_source, to: :first_round_in_link

  def live_podium
    merged_live_results.filter { it.advancing? && it.global_pos.in?(LiveResult::PODIUM_RANGE) }
  end

  def target_participation_condition
    self.target_rounds.first&.participation_condition
  end

  delegate :format, to: :first_round_in_link, prefix: :ranking

  alias_method :advancement_results, :merged_live_results

  def recompute_advancing(can_update_advancing)
    Live::Advancing.recompute_advancing(self, can_update_advancing: can_update_advancing)
  end

  def lock_results(locking_user)
    rounds.sum { it.lock_results(locking_user) }
  end

  delegate :final_round?, to: :last_round_in_link

  def self.combine_results(round_results)
    round_results
      .sort_by(&:potential_solve_time)
      # The Ruby StdLib guarantees that `uniq` always retains
      #   the *first* appearance of each entry. So we sort first,
      #   and then pick out the first (ie fastest) per competitor.
      .uniq(&:registration_id)
  end

  def advancing_competitor_ids
    live_results.where(advancing: true).unscope(:order).distinct.pluck(:registration_id)
  end

  def as_wcif_participation_source(target_round)
    {
      "type" => "linkedRounds",
      "roundIds" => self.wcif_ids,
      "resultCondition" => target_round.participation_condition&.to_wcif,
    }
  end

  # The _removed_round argument is passed by Rails
  # as part of the `has_many :rounds, after_remove: :destroy_if_orphaned` callback chain
  def destroy_if_orphaned(_removed_round = nil)
    return unless persisted? && rounds.size <= 1

    self.destroy # NULL is handled by has_many#dependent set to :nullify above
  end
end
