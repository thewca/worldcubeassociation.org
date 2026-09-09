# frozen_string_literal: true

class BackfillLinkedRoundResultsGlobalPos < ActiveRecord::Migration[8.1]
  def up
    Round.includes(:linked_round).where.not(linked_round_id: nil).find_each(&:recompute_results_global_pos)
  end

  def down
    # global_pos can be recomputed again; no inverse of the merged ranking.
  end
end
