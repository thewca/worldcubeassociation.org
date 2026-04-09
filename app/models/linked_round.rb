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
    LinkedRound.combine_results(live_results)
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

  delegate :final_round?, to: :last_round_in_link

  def self.combine_results(round_results)
    results_by_registration_id = round_results.group_by(&:registration_id)
    persons = results_by_registration_id.keys
    best_result_per_person = persons.map do |person|
      results_by_registration_id[person].min_by(&:values_for_sorting)
    end

    best_result_per_person.sort_by(&:values_for_sorting)
  end

  def as_wcif_participation_source(target_round)
    {
      "type" => "linkedRounds",
      "roundId" => self.wcif_ids,
      "resultCondition" => target_round.participation_condition.to_wcif,
    }
  end
end
