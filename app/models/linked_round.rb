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
    results_by_registration_id = round_results.group_by(&:registration_id)
    persons = results_by_registration_id.keys
    best_result_per_person = persons.map do |person|
      results_by_registration_id[person].min_by(&:potential_solve_time)
    end

    best_result_per_person.sort_by(&:potential_solve_time)
  end
end
