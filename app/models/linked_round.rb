# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds
  has_many :round_results, through: :rounds, source: :results
  has_many :competition_events, -> { distinct }, through: :rounds

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition" }

  def results
    LinkedRound.combine_results(round_results)
  end

  def self.combine_results(round_results)
    results_by_person_id = round_results.group_by(&:person_id)
    persons = results_by_person_id.keys
    best_result_per_person = persons.map do |person|
      results_by_person_id[person].min_by { |result| result.should_compute_average? ? result.average : result.best }
    end

    sorted_results = best_result_per_person.sort_by { |result| result.should_compute_average? ? result.to_solve_time(:average) : result.to_solve_time(:best) }
    # Overwrite pos for display purposes for now (including handling ties)
    last_time = nil
    last_pos = 0
    tie_count = 0

    sorted_results.each_with_index do |result, index|
      time = result.should_compute_average? ? result.to_solve_time(:average) : result.to_solve_time(:best)

      if last_time.present? && time == last_time
        # Same time → same position
        result.pos = last_pos
        tie_count += 1
      else
        # Different time → new position, accounting for skipped ranks
        last_pos = index + 1
        result.pos = last_pos
        last_time = time
        tie_count = 1
      end
    end

    sorted_results
  end
end
