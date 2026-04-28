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
end
