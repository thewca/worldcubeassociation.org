# frozen_string_literal: true

namespace :results do
  desc "Backfill global_pos for all results belonging to linked (dual) rounds"
  task backfill_linked_round_global_pos: :environment do
    LinkedRound.includes(:rounds).find_each(&:recompute_stored_global_pos)
  end
end
