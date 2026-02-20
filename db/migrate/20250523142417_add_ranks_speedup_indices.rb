# frozen_string_literal: true

class AddRanksSpeedupIndices < ActiveRecord::Migration[7.2]
  def change
    add_index :persons, :sub_id, name: :current_person_ranks_speedup

    add_index :concise_single_results, %i[person_id event_id continent_id country_id best], name: :single_ranks_speedup
    add_index :concise_average_results, %i[person_id event_id continent_id country_id average], name: :average_ranks_speedup
  end
end
