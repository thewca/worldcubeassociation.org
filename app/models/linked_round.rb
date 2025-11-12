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
    best_result_per_person.sort_by { |result| result.should_compute_average? ? result.to_solve_time(:average) : result.to_solve_time(:best) }
  end
end
