# frozen_string_literal: true

class LinkedRounds < ApplicationRecord
  has_many :rounds

  validate :all_round_consistency

  private def all_round_consistency
    return if rounds.empty?

    competition_ids = rounds.map(&:competition_id).uniq
    event_ids       = rounds.map(&:event_id).uniq
    round_numbers   = rounds.map(&:number).uniq

    if competition_ids.size > 1
      errors.add(:rounds, "must all belong to the same competition")
    end

    if event_ids.size > 1
      errors.add(:rounds, "must all belong to the same event")
    end

    if round_numbers.size > 1
      errors.add(:rounds, "must all belong to the same round number")
    end
  end

  def results
    rounds.flat_map { it.results }
  end
end
