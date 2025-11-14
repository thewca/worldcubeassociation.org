# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds
  has_many :round_results, through: :rounds, source: :results
  has_many :live_results, through: :rounds
  has_many :competition_events, -> { distinct }, through: :rounds
  has_many :formats, -> { distinct }, through: :rounds

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition" }

  def results
    LinkedRound.combine_results(round_results)
  end

  def self.combine_results(round_results)
    format = formats.first
    should_sort_by_single = format.sort_by == 'single'
    results_by_person_id = round_results.group_by(&:person_id)
    persons = results_by_person_id.keys
    best_result_per_person = persons.map do |person|
      results_by_person_id[person].min_by { |result| should_sort_by_single ? result.best : result.average }
    end

    sorted_results = best_result_per_person.sort_by { |result| should_sort_by_single ? result.to_solve_time(:best) : result.to_solve_time(:average) }
    # Overwrite pos for display purposes for now (including handling ties)
    last_result = nil
    last_pos = 0
    tie_count = 0

    sorted_results.each_with_index do |result, index|
      tied = false
      if last_result.present?
        tied = if %w[a m].include?(result.format_id)
                 # If the ranking is based on average, look at both average and best.
                 result.average == last_result.average && result.best == last_result.best
               else
                 # else we just compare the bests
                 result.best == last_result.best
               end
      end

      if tied
        result.pos = last_pos
        tie_count += 1
      else
        last_pos = index + 1
        result.pos = last_pos
        last_result = result
        tie_count = 1
      end
    end

    sorted_results
  end
end
