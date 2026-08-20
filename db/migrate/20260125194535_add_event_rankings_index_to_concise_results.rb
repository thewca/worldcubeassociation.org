# frozen_string_literal: true

class AddEventRankingsIndexToConciseResults < ActiveRecord::Migration[8.1]
  def change
    add_index :concise_single_results, %i[event_id person_id value_and_id], name: :event_rankings_speedup
    add_index :concise_average_results, %i[event_id person_id value_and_id], name: :event_rankings_speedup
  end
end
