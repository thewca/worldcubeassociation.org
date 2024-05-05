# frozen_string_literal: true

class AddTotalNumberOfRoundsToRound < ActiveRecord::Migration[5.2]
  def up
    add_column :rounds, :total_number_of_rounds, :integer, null: false

    # Structure to gather all changes
    updates_by_total_number_of_rounds = {
      1 => [],
      2 => [],
      3 => [],
      4 => [],
    }

    CompetitionEvent.includes(:rounds).all.reject { |ce| ce.rounds.empty? }.each do |ce|
      total_rounds = ce.rounds.size
      ce.rounds.each_with_index do |r, index|
        # We do *not* update the round right away, as it would fire one SQL update by round (!)
        # Instead we store this information to do a bulk update later
        updates_by_total_number_of_rounds[total_rounds] << r.id
      end
    end
    updates_by_total_number_of_rounds.each do |total_number_of_rounds, round_ids|
      Round.where(id: round_ids).update_all(total_number_of_rounds: total_number_of_rounds)
    end
  end

  def down
    remove_column :rounds, :total_number_of_rounds
  end
end
