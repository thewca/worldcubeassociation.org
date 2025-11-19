# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds
  has_many :results, through: :rounds
  has_many :live_results, through: :rounds
  has_many :formats, -> { distinct }, through: :rounds
  has_many :competition_events, -> { distinct }, through: :rounds

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition" }

  def merged_live_results
    LinkedRound.combine_results(live_results, formats.first)
  end

  def first_round_in_link
    rounds.ordered.first
  end

  def self.combine_results(round_results, format)
    rank_by = format.rank_by_column
    results_by_registration_id = round_results.group_by(&:registration_id)
    persons = results_by_registration_id.keys
    best_result_per_person = persons.map do |person|
      results_by_registration_id[person].min_by { |result| result.to_solve_time(rank_by) }
    end

    best_result_per_person.sort_by { |result| result.to_solve_time(rank_by) }
  end
end
