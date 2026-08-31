# frozen_string_literal: true

namespace :results do
  desc "Backfill global_pos for all results belonging to linked (dual) rounds"
  task backfill_linked_round_global_pos: :environment do
    Round.includes(:linked_round).where.not(linked_round_id: nil).find_each(&:recompute_results_global_pos)
  end
end
