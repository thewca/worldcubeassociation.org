# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds, -> { ordered }, inverse_of: :linked_round
  has_many :results, through: :rounds
  has_many :live_results, through: :rounds
  has_many :formats, -> { distinct }, through: :rounds
  has_many :competition_events, -> { distinct }, through: :rounds

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition" }

  def merged_live_results
    # Query directly instead of going through the cached :live_results association
    # I would love to know how to circumvent having to do this
    LinkedRound.combine_results(LiveResult.where(round: rounds))
  end

  def first_round_in_link
    rounds.first
  end

  def wcif_ids
    rounds.map(&:wcif_id)
  end

  def final_round?
    rounds.last&.final_round?
  end

  def self.combine_results(round_results)
    round_results
      .sort_by(&:potential_solve_time)
      # The Ruby StdLib guarantees that `uniq` always retains
      #   the *first* appearance of each entry. So we sort first,
      #   and then pick out the first (ie fastest) per competitor.
      .uniq(&:registration_id)
  end
end
