# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds, -> { ordered }, inverse_of: :linked_round
  has_many :results, through: :rounds
  has_many :live_results, through: :rounds
  has_many :formats, -> { distinct }, through: :rounds
  has_many :competition_events, -> { distinct }, through: :rounds
  has_many :target_rounds, class_name: "Round", as: :participation_source

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition" }

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

  def next_advancing_without(competitor_being_quit)
    Live::Advancing.next_advancing_without(merged_live_results, competitor_being_quit)
  end

  def recompute_advancing(advancement_condition, can_update_advancing)
    results_to_update = live_results.where.not(global_pos: nil).where(locked_by_id: nil)
    advancement_determining_condition = final_round? ? AdvancementConditions::RankingCondition.new(3) : advancement_condition
    Live::Advancing.recompute_advancing(merged_live_results, results_to_update, advancement_determining_condition, can_update_advancing: can_update_advancing)
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
    live_results.where(advancing: true).pluck(:registration_id).uniq
  end
end
